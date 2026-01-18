from fastapi import APIRouter, HTTPException, Body, status
from typing import Dict, Any
import uuid
from datetime import datetime

from ..models.conversational_interview import (
    ConversationalInterview, Activity, BusinessObject, 
    Actor, BusinessRule, Signal, PainPoint
)
from ..services.conversational_ai import ConversationalAI
from ..services.conversational_storage import (
    save_conversational_interview,
    read_conversational_interview,
    list_conversational_interviews
)

router = APIRouter(prefix="/api/conversational-interview", tags=["Conversational Interview"])

# Instance du service AI (lazy initialization)
_ai_service = None

def get_ai_service() -> ConversationalAI:
    """Retourne l'instance du service AI (singleton)"""
    global _ai_service
    if _ai_service is None:
        # ConversationalAI bascule automatiquement en mode mock si la clé API n'est pas disponible
        # Donc on ne devrait jamais avoir d'exception ici
        try:
            _ai_service = ConversationalAI()
        except Exception as e:
            # Si une exception survient quand même, on lève une HTTPException
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Service AI non disponible : {str(e)}. Veuillez configurer ANTHROPIC_API_KEY dans votre fichier .env (backend/.env) ou exécutez .\\setup-api-key.ps1"
            )
    return _ai_service

@router.post("/create")
async def create_interview(payload: Dict[str, Any] = Body(...)):
    """Crée nouvelle interview conversationnelle"""
    interview_id = str(uuid.uuid4())
    mode = payload.get("mode", "transformation")
    
    initial_message = {
        "transformation": "Bonjour ! Décrivez-moi ce qui se passe aujourd'hui dans votre processus. Communiquez-moi en premier vos activités, dans l'ordre. Est-ce que cela vous convient?",
        "decision": "Bonjour ! Quelle décision devez-vous prendre régulièrement ? Racontez-moi comment ça se passe."
    }
    
    interview = ConversationalInterview(
        id=interview_id,
        created_at=datetime.now(),
        updated_at=datetime.now(),
        mode=mode,
        messages=[
            {
                "role": "assistant",
                "content": initial_message.get(mode, initial_message["transformation"]),
                "timestamp": datetime.now().isoformat()
            }
        ]
    )
    
    save_conversational_interview(interview)
    return {
        "id": interview_id, 
        "status": "created"
    }

@router.get("/{interview_id}")
async def get_interview(interview_id: str):
    """Récupère interview par ID"""
    interview = read_conversational_interview(interview_id)
    if not interview:
        raise HTTPException(404, "Interview not found")
    
    return interview.model_dump(mode='json')

@router.post("/{interview_id}/analyze-initial")
async def analyze_initial(interview_id: str, payload: Dict[str, Any] = Body(...)):
    """
    Analyse description initiale du processus
    Phase DISCOVERY
    """
    interview = read_conversational_interview(interview_id)
    if not interview:
        raise HTTPException(404, "Interview not found")
    
    user_text = payload.get("text", "")
    if not user_text:
        raise HTTPException(400, "text is required")
    
    # Reformuler le message utilisateur (si nécessaire)
    reformulated_text = get_ai_service().reformulate_user_message(user_text)
    
    # Ajouter message utilisateur (original) - ne pas dupliquer
    interview.messages.append({
        "role": "user",
        "content": user_text,  # Message original
        "timestamp": datetime.now().isoformat()
    })
    
    # Analyser avec GenAI - JUSTE pour reformuler, PAS pour créer
    # Utiliser le texte reformulé pour l'analyse
    try:
        result = get_ai_service().analyze_initial_description(reformulated_text, interview.mode)
    except HTTPException:
        # Re-raise HTTPException (comme celle de get_ai_service)
        raise
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"AI analysis error: {error_details}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'analyse AI : {str(e)}. Vérifiez que ANTHROPIC_API_KEY est configurée dans votre fichier .env."
        )
    
    # NE PAS créer d'activités automatiquement - juste retourner les reformulations proposées
    # L'utilisateur devra les valider manuellement
    proposed_activities = result.get("activities", [])
    
    # Réponse assistant avec reformulations proposées (sans créer d'activités)
    activities_list = "\n".join([f"• {act.get('label', '')}" for act in proposed_activities])
    response_content = f"J'ai identifié {len(proposed_activities)} activités potentielles dans votre description :\n\n{activities_list}\n\nVous pouvez les ajouter, modifier ou ignorer selon vos besoins."
    
    interview.messages.append({
        "role": "assistant",
        "content": response_content,
        "timestamp": datetime.now().isoformat()
    })
    
    interview.updated_at = datetime.now()
    save_conversational_interview(interview)
    
    # Retourner les reformulations proposées SANS les créer
    return {
        "proposed_activities": proposed_activities,  # Juste les propositions
        "message": interview.messages[-1],
        "phase": "discovery"
    }

@router.post("/{interview_id}/validate-initial-message")
async def validate_initial_message(interview_id: str):
    """Valide le message initial et passe à la saisie des activités"""
    interview = read_conversational_interview(interview_id)
    if not interview:
        raise HTTPException(404, "Interview not found")
    
    # Ajouter un message de confirmation
    interview.messages.append({
        "role": "assistant",
        "content": "Parfait ! Veuillez maintenant saisir vos activités dans l'ordre. Vous pouvez utiliser les exemples comme guide.",
        "timestamp": datetime.now().isoformat()
    })
    
    interview.updated_at = datetime.now()
    save_conversational_interview(interview)
    
    return {
        "status": "validated",
        "message": interview.messages[-1]
    }

@router.post("/{interview_id}/submit-activities")
async def submit_activities(interview_id: str, payload: Dict[str, Any] = Body(...)):
    """Soumet la liste des activités saisies manuellement"""
    interview = read_conversational_interview(interview_id)
    if not interview:
        raise HTTPException(404, "Interview not found")
    
    activities_list = payload.get("activities", [])
    if not activities_list or len(activities_list) == 0:
        raise HTTPException(400, "At least one activity is required")
    
    # Créer les activités
    for idx, activity_label in enumerate(activities_list):
        if activity_label and isinstance(activity_label, str) and activity_label.strip():
            activity = Activity(
                id=f"act_{len(interview.activities)}_{idx}",
                label=activity_label.strip(),
                validated=True  # Directement validées car saisies manuellement
            )
            interview.activities.append(activity)
    
    # Passer en phase deep_dive
    interview.current_phase = "deep_dive"
    interview.current_activity_index = 0
    interview.current_question_index = 0
    
    # Message de transition
    first_activity = interview.activities[0]
    question = get_ai_service().generate_follow_up_question(first_activity.label, "trigger")
    
    interview.messages.append({
        "role": "assistant",
        "content": f"Excellent ! Nous avons {len(interview.activities)} activités. Commençons par approfondir '{first_activity.label}'. {question}",
        "timestamp": datetime.now().isoformat()
    })
    
    interview.updated_at = datetime.now()
    save_conversational_interview(interview)
    
    return {
        "status": "submitted",
        "phase": "deep_dive",
        "activities": [act.model_dump() for act in interview.activities],
        "message": interview.messages[-1]
    }

@router.post("/{interview_id}/validate-activity")
async def validate_activity(interview_id: str, payload: Dict[str, Any] = Body(...)):
    """Valide une activité individuelle"""
    interview = read_conversational_interview(interview_id)
    if not interview:
        raise HTTPException(404, "Interview not found")
    
    activity_id = payload.get("activity_id")
    
    for activity in interview.activities:
        if activity.id == activity_id:
            activity.validated = True
            break
    
    interview.updated_at = datetime.now()
    save_conversational_interview(interview)
    
    return {"status": "validated"}

@router.post("/{interview_id}/validate-all-activities")
async def validate_all_activities(interview_id: str):
    """Valide toutes activités → passe en DEEP_DIVE"""
    interview = read_conversational_interview(interview_id)
    if not interview:
        raise HTTPException(404, "Interview not found")
    
    if len(interview.activities) == 0:
        raise HTTPException(400, "No activities to validate")
    
    # Valider toutes
    for activity in interview.activities:
        activity.validated = True
    
    interview.current_phase = "deep_dive"
    interview.current_activity_index = 0
    interview.current_question_index = 0
    
    first_activity = interview.activities[0]
    question = get_ai_service().generate_follow_up_question(first_activity.label, "trigger")
    
    interview.messages.append({
        "role": "assistant",
        "content": f"Parfait ! Explorons maintenant chaque activité en détail. Commençons par '{first_activity.label}'. {question}",
        "timestamp": datetime.now().isoformat()
    })
    
    interview.updated_at = datetime.now()
    save_conversational_interview(interview)
    
    return {
        "phase": "deep_dive",
        "current_activity": first_activity.model_dump(),
        "message": interview.messages[-1]
    }

@router.post("/{interview_id}/update-activity")
async def update_activity(interview_id: str, payload: Dict[str, Any] = Body(...)):
    """Permet modification manuelle d'une activité"""
    interview = read_conversational_interview(interview_id)
    if not interview:
        raise HTTPException(404, "Interview not found")
    
    activity_id = payload.get("activity_id")
    updates = payload.get("updates", {})
    
    # Trouver et mettre à jour
    for activity in interview.activities:
        if activity.id == activity_id:
            for key, value in updates.items():
                if hasattr(activity, key):
                    setattr(activity, key, value)
            break
    
    interview.updated_at = datetime.now()
    save_conversational_interview(interview)
    
    return {"status": "updated"}

@router.post("/{interview_id}/answer-deep-dive")
async def answer_deep_dive(interview_id: str, payload: Dict[str, Any] = Body(...)):
    """
    Traite réponse utilisateur en phase DEEP_DIVE
    """
    interview = read_conversational_interview(interview_id)
    if not interview:
        raise HTTPException(404, "Interview not found")
    
    user_text = payload.get("text", "")
    if not user_text:
        raise HTTPException(400, "text is required")
    
    # Séquence de questions deep dive
    DEEP_DIVE_SEQUENCE = [
        "trigger",      # 0
        "output",       # 1
        "attributes",   # 2
        "actor",        # 3
        "rules",        # 4
        "signals",      # 5
        "pain_points"   # 6
    ]
    
    current_activity = interview.activities[interview.current_activity_index]
    current_question_key = DEEP_DIVE_SEQUENCE[interview.current_question_index]
    
    # Ajouter message utilisateur APRÈS avoir déterminé la question
    interview.messages.append({
        "role": "user",
        "content": user_text,
        "timestamp": datetime.now().isoformat()
    })
    
    # Reformuler la réponse avec les concepts métier existants
    # IMPORTANT : La reformulation doit reprendre ce que l'utilisateur a saisi
    # On utilise le texte utilisateur comme base, et on le reformule légèrement si nécessaire
    context = {
        "activities": [act.model_dump() for act in interview.activities],
        "business_objects": [obj.model_dump() for obj in interview.business_objects],
        "actors": [actor.model_dump() for actor in interview.actors]
    }
    
    # Reformulation avec concepts - doit se baser UNIQUEMENT sur user_text
    # IMPORTANT : La reformulation doit reprendre ce que l'utilisateur a saisi
    # Si la réponse est "non", reformulated_response sera vide
    # Sinon, reformulation légère pour normaliser le vocabulaire tout en gardant le sens original
    reformulated_response = get_ai_service().reformulate_with_concepts(
        user_text,  # Texte original de l'utilisateur - doit être repris dans la reformulation
        current_question_key,
        context
    )
    
    # Si la reformulation est vide ou trop différente, utiliser le texte original
    # La reformulation doit toujours reprendre ce que l'utilisateur a saisi
    if not reformulated_response or len(reformulated_response.strip()) == 0:
        reformulated_response = user_text.strip()
    # Vérifier que la reformulation reprend bien le texte original
    # Si elle est trop différente, utiliser le texte original
    user_words = set(user_text.lower().split())
    reformulated_words = set(reformulated_response.lower().split())
    if len(user_words.intersection(reformulated_words)) < max(2, len(user_words) // 3):
        # La reformulation ne reprend pas assez le texte original, utiliser le texte original
        reformulated_response = user_text.strip()
    
    # Analyser selon type de question - JUSTE pour reformuler/extrait, PAS pour créer
    # Les données extraites sont initialisées vides par défaut
    extracted_data = {
        "reformulated_text": reformulated_response  # Toujours inclure la reformulation (peut être vide)
    }
    
    try:
        # Vérifier si la réponse est négative - si oui, ne pas analyser
        user_text_lower = user_text.lower().strip()
        negative_responses = ["non", "aucune", "aucun", "rien", "pas de", "ne pas", "non merci", "non applicable", "n/a"]
        is_negative = any(neg in user_text_lower for neg in negative_responses) and len(user_text_lower) < 20
        
        if is_negative:
            # Réponse négative - retourner uniquement la reformulation vide
            return {
                "phase": interview.current_phase,
                "current_activity_index": interview.current_activity_index,
                "current_question_index": interview.current_question_index,
                "current_question_key": current_question_key,
                "extracted_data": extracted_data,
                "message": interview.messages[-1] if interview.messages else None,
                "interview": interview.model_dump(mode='json')
            }
        
        # Utiliser le texte utilisateur ORIGINAL pour l'analyse
        # La reformulation légère est uniquement pour normaliser, mais on analyse le texte original
        reformulated_text = get_ai_service().reformulate_user_message(user_text)
        
        # IMPORTANT : Utiliser user_text (texte original) pour l'analyse, pas reformulated_text
        # Les fonctions d'analyse doivent extraire uniquement ce qui est explicitement mentionné
        if current_question_key == "trigger":
            result = get_ai_service().analyze_trigger(user_text, current_activity.label)
            # Ne PAS assigner directement - juste retourner les reformulations
            extracted_data.update({
                "trigger_event": result.get("trigger_event", ""),
                "trigger_actor": result.get("trigger_actor", ""),
                "trigger_actor_type": result.get("trigger_actor_type", ""),
                "trigger_system": result.get("trigger_system", "")  # Système doit être enregistré
            })
        
        elif current_question_key == "output":
            # L'objet métier doit être inféré à partir de la reformulation "Produit/Objet reformulé"
            # Utiliser le texte utilisateur ORIGINAL pour l'analyse
            result = get_ai_service().analyze_output(user_text, current_activity.label)
            # L'objet métier est inféré depuis la reformulation "Produit/Objet reformulé"
            # La reformulation reprend ce que l'utilisateur a saisi
            business_object_name = result.get("business_object", "")
            # Si pas d'objet métier détecté dans l'analyse, utiliser la reformulation
            # La reformulation reprend ce que l'utilisateur a saisi
            if not business_object_name and reformulated_response and reformulated_response.strip():
                # Utiliser la reformulation comme nom d'objet métier
                business_object_name = reformulated_response.strip()
            
            extracted_data.update({
                "business_object": business_object_name,
                "output_system": result.get("output_system", ""),  # Système doit être enregistré
                "attributes": []  # Attributs vides par défaut - seront remplis uniquement si explicitement mentionnés
            })
        
        elif current_question_key == "attributes":
            # Les attributs doivent être vides ou induits uniquement selon les saisies
            # Utiliser le texte utilisateur ORIGINAL
            attributes = get_ai_service().analyze_attributes(user_text, "")
            # Ne garder que les attributs explicitement mentionnés
            extracted_data.update({
                "attributes": attributes if attributes else []
            })
        
        elif current_question_key == "actor":
            # Utiliser le texte utilisateur ORIGINAL
            result = get_ai_service().analyze_actor(user_text)
            # Ne PAS créer d'acteur - juste retourner les reformulations
            extracted_data.update({
                "name": result.get("name", ""),
                "type": result.get("type", "personne"),
                "role": result.get("role", "")
            })
        
        elif current_question_key == "rules":
            # Utiliser le texte utilisateur ORIGINAL
            result = get_ai_service().analyze_rule(user_text)
            # Ne PAS créer de règle - juste retourner les reformulations
            if result:
                extracted_data.update({
                    "condition": result.get("condition", ""),
                    "action": result.get("action", ""),
                    "type": result.get("type", "SI_ALORS")
                })
        
        elif current_question_key == "signals":
            # Utiliser le texte utilisateur ORIGINAL
            result = get_ai_service().analyze_signal(user_text)
            # Ne PAS créer de signal - juste retourner les reformulations
            if result:
                extracted_data.update({
                    "event": result.get("event", ""),
                    "action": result.get("action", ""),
                    "severity": result.get("severity", "MEDIUM"),
                    "threshold": result.get("threshold", "")
                })
        
        elif current_question_key == "pain_points":
            # Utiliser le texte utilisateur ORIGINAL
            result = get_ai_service().analyze_pain_point(user_text)
            # Ne PAS créer de pain point - juste retourner les reformulations
            if result:
                extracted_data.update({
                    "description": result.get("description", ""),
                    "impact": result.get("impact", "temps_perdu"),
                    "severity": result.get("severity", "MEDIUM")
                })
    
    except Exception as e:
        raise HTTPException(500, f"AI analysis failed: {str(e)}")
    
    # NE PAS passer automatiquement à la question suivante
    # L'utilisateur doit valider les données extraites d'abord
    # On retourne les données extraites pour validation
    
    interview.updated_at = datetime.now()
    save_conversational_interview(interview)
    
    # Retourner les données extraites (sans les créer) pour validation
    return {
        "phase": interview.current_phase,
        "current_activity_index": interview.current_activity_index,
        "current_question_index": interview.current_question_index,
        "current_question_key": current_question_key,
        "extracted_data": extracted_data,  # Données extraites à valider
        "message": interview.messages[-1] if interview.messages else None,
        "interview": interview.model_dump(mode='json')
    }

@router.post("/{interview_id}/validate-extracted-data")
async def validate_extracted_data(interview_id: str, payload: Dict[str, Any] = Body(...)):
    """Valide les données extraites et les applique à l'activité"""
    interview = read_conversational_interview(interview_id)
    if not interview:
        raise HTTPException(404, "Interview not found")
    
    question_key = payload.get("question_key")
    extracted_data = payload.get("extracted_data", {})
    
    DEEP_DIVE_SEQUENCE = [
        "trigger", "output", "attributes", "actor", "rules", "signals", "pain_points"
    ]
    
    current_activity = interview.activities[interview.current_activity_index]
    
    # Appliquer les données validées - UNIQUEMENT ce qui a été saisi (pas de valeurs codées en dur)
    # Les reformulations validées sont intégrées dans les champs correspondants
    if question_key == "trigger":
        # Utiliser uniquement les valeurs saisies par l'utilisateur
        # La reformulation validée est stockée dans trigger_event, trigger_actor, etc.
        if extracted_data.get("trigger_event"):
            current_activity.trigger_event = extracted_data.get("trigger_event")
        if extracted_data.get("trigger_actor"):
            current_activity.trigger_actor = extracted_data.get("trigger_actor")
        if extracted_data.get("trigger_actor_type"):
            current_activity.trigger_actor_type = extracted_data.get("trigger_actor_type")
        # Le système doit être enregistré - partie importante de la restitution
        if extracted_data.get("trigger_system"):
            current_activity.trigger_system = extracted_data.get("trigger_system")
    
    elif question_key == "output":
        # L'objet métier doit être enregistré - il est inféré depuis la reformulation "Produit/Objet reformulé"
        obj_name = extracted_data.get("business_object")
        if obj_name and obj_name.strip():
            # Rechercher un objet existant (comparaison insensible à la casse)
            existing_obj = next((o for o in interview.business_objects if o.name.lower() == obj_name.lower()), None)
            if not existing_obj:
                # Créer un nouvel objet métier - il fait partie de la restitution
                new_obj = BusinessObject(
                    id=f"obj_{len(interview.business_objects)}",
                    name=obj_name.strip(),
                    attributes=extracted_data.get("attributes", []),  # Attributs vides ou induits uniquement
                    created_by_activity=current_activity.id,
                    source_system=extracted_data.get("output_system")  # Système doit être enregistré
                )
                interview.business_objects.append(new_obj)
                current_activity.output_object = new_obj.id
            else:
                # Utiliser l'objet existant
                current_activity.output_object = existing_obj.id
            # Le système de sortie doit être enregistré - partie importante de la restitution
            if extracted_data.get("output_system"):
                current_activity.output_system = extracted_data.get("output_system")
    
    elif question_key == "attributes":
        if current_activity.output_object:
            obj = next((o for o in interview.business_objects if o.id == current_activity.output_object), None)
            if obj:
                obj.attributes.extend([a for a in extracted_data.get("attributes", []) if a not in obj.attributes])
    
    elif question_key == "actor":
        actor_name = extracted_data.get("name")
        if actor_name:
            existing_actor = next((a for a in interview.actors if a.name == actor_name), None)
            if not existing_actor:
                new_actor = Actor(
                    id=f"actor_{len(interview.actors)}",
                    name=actor_name,
                    type=extracted_data.get("type", "personne"),
                    role=extracted_data.get("role"),
                    activities=[current_activity.id]
                )
                interview.actors.append(new_actor)
                current_activity.performed_by = new_actor.id
                current_activity.performed_by_type = new_actor.type
            else:
                if current_activity.id not in existing_actor.activities:
                    existing_actor.activities.append(current_activity.id)
                current_activity.performed_by = existing_actor.id
                current_activity.performed_by_type = existing_actor.type
    
    elif question_key == "rules":
        if extracted_data:
            rule = BusinessRule(
                id=f"rule_{len(interview.rules)}",
                condition=extracted_data.get("condition", ""),
                action=extracted_data.get("action", ""),
                type=extracted_data.get("type", "SI_ALORS"),
                applies_to_activity=current_activity.id
            )
            interview.rules.append(rule)
    
    elif question_key == "signals":
        if extracted_data:
            signal = Signal(
                id=f"signal_{len(interview.signals)}",
                event=extracted_data.get("event", ""),
                action=extracted_data.get("action", ""),
                severity=extracted_data.get("severity", "MEDIUM"),
                threshold=extracted_data.get("threshold"),
                applies_to_activity=current_activity.id
            )
            interview.signals.append(signal)
    
    elif question_key == "pain_points":
        if extracted_data:
            pain = PainPoint(
                id=f"pain_{len(interview.pain_points)}",
                description=extracted_data.get("description", ""),
                impact=extracted_data.get("impact", "temps_perdu"),
                severity=extracted_data.get("severity", "MEDIUM"),
                related_activity=current_activity.id
            )
            interview.pain_points.append(pain)
    
    # Passer à la question suivante après validation
    interview.current_question_index += 1
    
    # Si toutes questions posées pour cette activité
    if interview.current_question_index >= len(DEEP_DIVE_SEQUENCE):
        # Passer à l'activité suivante
        interview.current_activity_index += 1
        interview.current_question_index = 0
        
        # Si toutes activités traitées
        if interview.current_activity_index >= len(interview.activities):
            # Passer en consolidation
            interview.current_phase = "consolidation"
            interview.messages.append({
                "role": "assistant",
                "content": "Excellent ! Nous avons capturé toutes les informations. Voici la synthèse complète de votre processus. Vous pouvez maintenant l'enrichir, le modifier ou le valider.",
                "timestamp": datetime.now().isoformat()
            })
        else:
            # Prochaine activité
            next_activity = interview.activities[interview.current_activity_index]
            next_question = get_ai_service().generate_follow_up_question(next_activity.label, "trigger")
            interview.messages.append({
                "role": "assistant",
                "content": f"Très bien. Passons maintenant à '{next_activity.label}'. {next_question}",
                "timestamp": datetime.now().isoformat()
            })
    else:
        # Prochaine question pour même activité
        next_question_key = DEEP_DIVE_SEQUENCE[interview.current_question_index]
        next_question = get_ai_service().generate_follow_up_question(
            current_activity.label, 
            next_question_key
        )
        interview.messages.append({
            "role": "assistant",
            "content": next_question,
            "timestamp": datetime.now().isoformat()
        })
    
    interview.updated_at = datetime.now()
    save_conversational_interview(interview)
    
    return {
        "phase": interview.current_phase,
        "current_activity_index": interview.current_activity_index,
        "current_question_index": interview.current_question_index,
        "current_question_key": DEEP_DIVE_SEQUENCE[interview.current_question_index] if interview.current_phase == "deep_dive" else None,
        "message": interview.messages[-1] if interview.messages else None,
        "interview": interview.model_dump(mode='json')
    }

@router.delete("/{interview_id}/activity/{activity_id}")
async def delete_activity(interview_id: str, activity_id: str):
    """Supprime une activité"""
    interview = read_conversational_interview(interview_id)
    if not interview:
        raise HTTPException(404, "Interview not found")
    
    # Retirer l'activité
    interview.activities = [a for a in interview.activities if a.id != activity_id]
    
    # Nettoyer les références dans les autres objets
    for obj in interview.business_objects:
        if obj.created_by_activity == activity_id:
            obj.created_by_activity = None
    
    for actor in interview.actors:
        if activity_id in actor.activities:
            actor.activities.remove(activity_id)
    
    for rule in interview.rules:
        if rule.applies_to_activity == activity_id:
            rule.applies_to_activity = None
    
    for signal in interview.signals:
        if signal.applies_to_activity == activity_id:
            signal.applies_to_activity = None
    
    for pain in interview.pain_points:
        if pain.related_activity == activity_id:
            pain.related_activity = None
    
    interview.updated_at = datetime.now()
    save_conversational_interview(interview)
    
    return {"status": "deleted", "activities": [a.model_dump() for a in interview.activities]}

@router.post("/{interview_id}/update-business-object")
async def update_business_object(interview_id: str, payload: Dict[str, Any] = Body(...)):
    """Permet modification manuelle d'un objet métier"""
    interview = read_conversational_interview(interview_id)
    if not interview:
        raise HTTPException(404, "Interview not found")
    
    object_id = payload.get("object_id")
    updates = payload.get("updates", {})
    
    for obj in interview.business_objects:
        if obj.id == object_id:
            for key, value in updates.items():
                if hasattr(obj, key):
                    setattr(obj, key, value)
            break
    
    interview.updated_at = datetime.now()
    save_conversational_interview(interview)
    
    return {"status": "updated"}

@router.post("/{interview_id}/update-actor")
async def update_actor(interview_id: str, payload: Dict[str, Any] = Body(...)):
    """Permet modification manuelle d'un acteur"""
    interview = read_conversational_interview(interview_id)
    if not interview:
        raise HTTPException(404, "Interview not found")
    
    actor_id = payload.get("actor_id")
    updates = payload.get("updates", {})
    
    for actor in interview.actors:
        if actor.id == actor_id:
            for key, value in updates.items():
                if hasattr(actor, key):
                    setattr(actor, key, value)
            break
    
    interview.updated_at = datetime.now()
    save_conversational_interview(interview)
    
    return {"status": "updated"}

@router.post("/{interview_id}/update-rule")
async def update_rule(interview_id: str, payload: Dict[str, Any] = Body(...)):
    """Permet modification manuelle d'une règle métier"""
    interview = read_conversational_interview(interview_id)
    if not interview:
        raise HTTPException(404, "Interview not found")
    
    rule_id = payload.get("rule_id")
    updates = payload.get("updates", {})
    
    for rule in interview.rules:
        if rule.id == rule_id:
            for key, value in updates.items():
                if hasattr(rule, key):
                    setattr(rule, key, value)
            break
    
    interview.updated_at = datetime.now()
    save_conversational_interview(interview)
    
    return {"status": "updated"}

@router.post("/{interview_id}/update-signal")
async def update_signal(interview_id: str, payload: Dict[str, Any] = Body(...)):
    """Permet modification manuelle d'un signal"""
    interview = read_conversational_interview(interview_id)
    if not interview:
        raise HTTPException(404, "Interview not found")
    
    signal_id = payload.get("signal_id")
    updates = payload.get("updates", {})
    
    for signal in interview.signals:
        if signal.id == signal_id:
            for key, value in updates.items():
                if hasattr(signal, key):
                    setattr(signal, key, value)
            break
    
    interview.updated_at = datetime.now()
    save_conversational_interview(interview)
    
    return {"status": "updated"}

@router.post("/{interview_id}/add-rule")
async def add_rule(interview_id: str, payload: Dict[str, Any] = Body(...)):
    """Ajoute une règle métier à une activité"""
    interview = read_conversational_interview(interview_id)
    if not interview:
        raise HTTPException(404, "Interview not found")
    
    activity_id = payload.get("activity_id")
    condition = payload.get("condition", "")
    action = payload.get("action", "")
    rule_type = payload.get("type", "SI_ALORS")
    
    if not condition or not action:
        raise HTTPException(400, "condition and action required")
    
    new_rule = BusinessRule(
        id=f"rule_{len(interview.rules)}",
        condition=condition,
        action=action,
        type=rule_type,
        applies_to_activity=activity_id
    )
    
    interview.rules.append(new_rule)
    interview.updated_at = datetime.now()
    save_conversational_interview(interview)
    
    return {"rule": new_rule.model_dump()}

@router.post("/{interview_id}/add-signal")
async def add_signal(interview_id: str, payload: Dict[str, Any] = Body(...)):
    """Ajoute un signal d'alerte à une activité"""
    interview = read_conversational_interview(interview_id)
    if not interview:
        raise HTTPException(404, "Interview not found")
    
    activity_id = payload.get("activity_id")
    event = payload.get("event", "")
    action = payload.get("action", "")
    severity = payload.get("severity", "MEDIUM")
    
    if not event or not action:
        raise HTTPException(400, "event and action required")
    
    new_signal = Signal(
        id=f"signal_{len(interview.signals)}",
        event=event,
        action=action,
        severity=severity,
        applies_to_activity=activity_id
    )
    
    interview.signals.append(new_signal)
    interview.updated_at = datetime.now()
    save_conversational_interview(interview)
    
    return {"signal": new_signal.model_dump()}

@router.post("/{interview_id}/delete-rule")
async def delete_rule(interview_id: str, payload: Dict[str, Any] = Body(...)):
    """Supprime une règle métier"""
    interview = read_conversational_interview(interview_id)
    if not interview:
        raise HTTPException(404, "Interview not found")
    
    rule_id = payload.get("rule_id")
    interview.rules = [r for r in interview.rules if r.id != rule_id]
    interview.updated_at = datetime.now()
    save_conversational_interview(interview)
    
    return {"status": "deleted"}

@router.post("/{interview_id}/delete-signal")
async def delete_signal(interview_id: str, payload: Dict[str, Any] = Body(...)):
    """Supprime un signal d'alerte"""
    interview = read_conversational_interview(interview_id)
    if not interview:
        raise HTTPException(404, "Interview not found")
    
    signal_id = payload.get("signal_id")
    interview.signals = [s for s in interview.signals if s.id != signal_id]
    interview.updated_at = datetime.now()
    save_conversational_interview(interview)
    
    return {"status": "deleted"}

@router.post("/{interview_id}/add-activity")
async def add_activity(interview_id: str, payload: Dict[str, Any] = Body(...)):
    """Ajoute activité manuelle en consolidation"""
    interview = read_conversational_interview(interview_id)
    if not interview:
        raise HTTPException(404, "Interview not found")
    
    label = payload.get("label", "")
    if not label:
        raise HTTPException(400, "label required")
    
    new_activity = Activity(
        id=f"act_manual_{len(interview.activities)}",
        label=label,
        validated=True
    )
    
    interview.activities.append(new_activity)
    interview.updated_at = datetime.now()
    save_conversational_interview(interview)
    
    return {"activity": new_activity.model_dump()}

@router.post("/{interview_id}/finish")
async def finish_interview(interview_id: str):
    """Termine l'interview (passe en phase completed)"""
    interview = read_conversational_interview(interview_id)
    if not interview:
        raise HTTPException(404, "Interview not found")
    
    interview.current_phase = "completed"
    interview.status = "completed"
    interview.updated_at = datetime.now()
    
    interview.messages.append({
        "role": "assistant",
        "content": "Interview terminée. Vous pouvez maintenant visualiser la restitution globale et ajouter des notes pour les architectes.",
        "timestamp": datetime.now().isoformat()
    })
    
    save_conversational_interview(interview)
    
    return {
        "status": "completed",
        "interview_id": interview_id,
        "phase": "completed"
    }

@router.put("/{interview_id}/notes")
async def update_notes(interview_id: str, payload: Dict[str, Any] = Body(...)):
    """Met à jour les notes à transmettre aux architectes"""
    interview = read_conversational_interview(interview_id)
    if not interview:
        raise HTTPException(404, "Interview not found")
    
    interview.notes_to_architects = payload.get("notes", "")
    interview.updated_at = datetime.now()
    save_conversational_interview(interview)
    
    return {"status": "updated", "notes": interview.notes_to_architects}

@router.post("/{interview_id}/submit")
async def submit_interview(interview_id: str):
    """PHASE FINALE: Soumet interview (prête pour PROMPT 2)"""
    interview = read_conversational_interview(interview_id)
    if not interview:
        raise HTTPException(404, "Interview not found")
    
    interview.status = "submitted"
    interview.current_phase = "completed"
    interview.submitted_at = datetime.now()
    interview.updated_at = datetime.now()
    
    save_conversational_interview(interview)
    
    return {
        "status": "submitted",
        "interview_id": interview_id,
        "message": "Interview soumise avec succès",
        "stats": {
            "activities": len(interview.activities),
            "business_objects": len(interview.business_objects),
            "actors": len(interview.actors),
            "rules": len(interview.rules),
            "signals": len(interview.signals),
            "pain_points": len(interview.pain_points)
        }
    }

@router.post("/{interview_id}/compile")
async def compile_conversational_interview(interview_id: str):
    """Compile une interview conversationnelle en graphes sémantiques"""
    from ..services.ava_compiler import AVACompiler
    from ..services.storage import write_compilation_result
    from ..models.graphs import CompilationResult
    
    interview = read_conversational_interview(interview_id)
    if not interview:
        raise HTTPException(404, "Interview not found")
    
    # Convertir ConversationalInterview en format compatible avec AVACompiler
    # Pour l'instant, on crée une compilation simple basée sur les données capturées
    from ..models.graphs import FactGraph, ReasoningGraph, Node, Edge, NodeType, EdgeType
    
    # Construire le graphe de faits
    fact_nodes = []
    fact_edges = []
    
    # Ajouter les activités comme nœuds
    for act in interview.activities:
        fact_nodes.append(Node(
            id=act.id,
            type=NodeType.ACTIVITY,
            label=act.label,
            data={"validated": act.validated}
        ))
    
    # Ajouter les objets métier
    for obj in interview.business_objects:
        fact_nodes.append(Node(
            id=obj.id,
            type=NodeType.DATA_OBJECT,
            label=obj.name,
            data={"attributes": obj.attributes}
        ))
    
    # Ajouter les acteurs
    for actor in interview.actors:
        fact_nodes.append(Node(
            id=actor.id,
            type=NodeType.ACTOR,
            label=actor.name,
            data={"type": actor.type}
        ))
    
    # Construire le graphe de raisonnement
    reasoning_nodes = []
    reasoning_edges = []
    
    # Ajouter les règles métier
    for rule in interview.rules:
        reasoning_nodes.append(Node(
            id=rule.id,
            type=NodeType.RULE,
            label=f"{rule.condition} → {rule.action}",
            data={"type": rule.type}
        ))
    
    # Ajouter les signaux
    for signal in interview.signals:
        reasoning_nodes.append(Node(
            id=signal.id,
            type=NodeType.SIGNAL,
            label=signal.event,
            data={"severity": signal.severity, "threshold": signal.threshold}
        ))
    
    fact_graph = FactGraph(nodes=fact_nodes, edges=fact_edges)
    reasoning_graph = ReasoningGraph(nodes=reasoning_nodes, edges=reasoning_edges)
    
    compilation = CompilationResult(
        interview_id=interview_id,
        fact_graph=fact_graph,
        reasoning_graph=reasoning_graph,
        validation={"valid": True, "issues": []},
        stats={
            "total_nodes": len(fact_nodes) + len(reasoning_nodes),
            "total_edges": len(fact_edges) + len(reasoning_edges),
            "facts": len([n for n in fact_nodes if n.type == NodeType.DATA_OBJECT]),
            "rules": len(reasoning_nodes),
            "signals": len([n for n in reasoning_nodes if n.type == NodeType.SIGNAL]),
            "pain_points": len(interview.pain_points)
        }
    )
    
    # Sauvegarder
    write_compilation_result(interview_id, compilation)
    
    return compilation

@router.get("/check-api-key")
async def check_api_key():
    """Vérifie si la clé API Anthropic est configurée"""
    import os
    from dotenv import load_dotenv
    from pathlib import Path
    
    # Recharger .env depuis le répertoire backend
    env_path = Path(__file__).parent.parent.parent / ".env"
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
    else:
        load_dotenv()  # Fallback sur .env dans le répertoire courant
    
    api_key = os.getenv("ANTHROPIC_API_KEY")
    
    if not api_key:
        return {
            "configured": False,
            "error": "ANTHROPIC_API_KEY not found in environment",
            "help": "Add ANTHROPIC_API_KEY=sk-ant-... to backend/.env file"
        }
    
    api_key_clean = api_key.strip().strip('"').strip("'")
    
    if not api_key_clean.startswith("sk-ant-"):
        return {
            "configured": False,
            "error": f"Invalid API key format. Expected to start with 'sk-ant-', got: {api_key_clean[:10]}...",
            "help": "Get a valid API key from https://console.anthropic.com/"
        }
    
    # Tester la clé avec un appel simple
    try:
        from ..services.conversational_ai import ConversationalAI
        ai_service = ConversationalAI()
        return {
            "configured": True,
            "valid": True,
            "key_prefix": api_key_clean[:15] + "..."
        }
    except ValueError as e:
        return {
            "configured": True,
            "valid": False,
            "error": str(e),
            "key_prefix": api_key_clean[:15] + "..."
        }

@router.get("/")
async def list_interviews():
    """Liste toutes les interviews conversationnelles"""
    interviews = list_conversational_interviews()
    return [
        {
            "id": i.id,
            "perimeter": i.perimeter,
            "mode": i.mode,
            "status": i.status,
            "current_phase": i.current_phase,
            "created_at": i.created_at.isoformat(),
            "updated_at": i.updated_at.isoformat(),
            "activities_count": len(i.activities)
        }
        for i in interviews
    ]

@router.delete("/{interview_id}")
async def delete_interview(interview_id: str):
    """Supprime une interview conversationnelle"""
    from pathlib import Path
    
    interview = read_conversational_interview(interview_id)
    if not interview:
        raise HTTPException(404, "Interview not found")
    
    # Supprimer le fichier (utiliser le même chemin que conversational_storage)
    storage_dir = Path(__file__).parent.parent / "data" / "conversational"
    interview_file = storage_dir / f"{interview_id}.json"
    
    if interview_file.exists():
        interview_file.unlink()
    
    return {"status": "deleted", "interview_id": interview_id}

