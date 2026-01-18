from typing import Dict, Any, List, Optional
import anthropic
from anthropic import AuthenticationError, APIError
import os
import re
import json

class ConversationalAI:
    """Service GenAI pour analyse conversationnelle (Claude API)"""
    
    def __init__(self):
        api_key = os.getenv("ANTHROPIC_API_KEY")
        self.use_mock = False
        
        if not api_key:
            self.use_mock = True
            print("WARNING: MODE DEVELOPPEMENT - ANTHROPIC_API_KEY non configuree. Utilisation de reponses mockees.")
            return
        
        # Nettoyer la clé (retirer espaces, guillemets)
        api_key = api_key.strip().strip('"').strip("'")
        
        # Valider le format de base (doit commencer par sk-ant-)
        # Détecter les placeholders
        placeholder_patterns = ["sk-ant-api03-...", "sk-ant-api03-REMPLACEZ-PAR-VOTRE-CLE-ICI", "REMPLACEZ", "..."]
        is_placeholder = any(pattern in api_key for pattern in placeholder_patterns) or len(api_key) < 30
        
        if not api_key.startswith("sk-ant-") or is_placeholder:
            self.use_mock = True
            print("WARNING: MODE DEVELOPPEMENT - Cle API invalide ou placeholder. Utilisation de reponses mockees.")
            print("   Pour utiliser l'API reelle, configurez ANTHROPIC_API_KEY dans backend/.env")
            return
        
        try:
            self.client = anthropic.Anthropic(api_key=api_key)
            # Test rapide de la clé
            try:
                # Test minimal pour valider la clé
                self.client.messages.create(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=10,
                    messages=[{"role": "user", "content": "test"}]
                )
            except AuthenticationError:
                self.use_mock = True
                print("WARNING: MODE DEVELOPPEMENT - Cle API invalide ou expiree. Utilisation de reponses mockees.")
                print("   Configurez une cle valide dans backend/.env ou executez .\\setup-api-key.ps1")
            except Exception:
                # Autres erreurs (rate limit, etc.) - on continue avec l'API réelle
                pass
        except Exception as e:
            self.use_mock = True
            print(f"WARNING: MODE DEVELOPPEMENT - Erreur d'initialisation Anthropic : {str(e)}")
            print("   Utilisation de reponses mockees. Configurez la cle API pour utiliser l'API reelle.")
    
    def _call_claude_api(self, prompt: str, max_tokens: int = 2000) -> str:
        """Helper pour appeler l'API Claude avec gestion d'erreur centralisée"""
        # Mode mock pour développement
        if self.use_mock:
            return self._mock_response(prompt)
        
        try:
            message = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=max_tokens,
                temperature=0,
                messages=[{"role": "user", "content": prompt}]
            )
            
            if not message.content or len(message.content) == 0:
                raise ValueError("Empty response from Claude API")
            
            return message.content[0].text
        except AuthenticationError as e:
            # Basculer en mode mock si erreur d'auth
            self.use_mock = True
            print(f"WARNING: Erreur d'authentification. Passage en mode mock. Configurez votre cle API.")
            return self._mock_response(prompt)
        except APIError as e:
            raise ValueError(
                f"Erreur API Anthropic : {str(e)}. "
                f"Vérifiez que votre clé API est valide et que vous avez des crédits disponibles."
            )
        except Exception as e:
            error_msg = str(e)
            if "401" in error_msg or "authentication" in error_msg.lower() or "invalid x-api-key" in error_msg.lower():
                # Basculer en mode mock
                self.use_mock = True
                print(f"WARNING: Erreur d'authentification. Passage en mode mock.")
                return self._mock_response(prompt)
            raise ValueError(f"Erreur Claude API : {error_msg}")
    
    def _mock_response(self, prompt: str) -> str:
        """Génère une réponse mockée pour le développement"""
        # Analyser le type de prompt pour générer une réponse appropriée
        prompt_lower = prompt.lower()
        
        # Découverte initiale
        if "activités" in prompt_lower or "activities" in prompt_lower:
            return json.dumps({
                "activities": [
                    {"label": "Recevoir demande client", "confidence": 0.9},
                    {"label": "Vérifier disponibilité stock", "confidence": 0.85},
                    {"label": "Créer devis client", "confidence": 0.9}
                ]
            })
        
        # Trigger
        if "trigger" in prompt_lower or "déclenche" in prompt_lower:
            return json.dumps({
                "trigger_event": "Demande client",
                "trigger_actor": "Client",
                "trigger_actor_type": "personne",
                "trigger_system": "Messagerie"
            })
        
        # Output
        if "output" in prompt_lower or "produit" in prompt_lower or "créé" in prompt_lower:
            return json.dumps({
                "business_object": "Commande",
                "output_system": "CRM",
                "attributes": ["numéro", "date", "client"]
            })
        
        # Attributes
        if "attributs" in prompt_lower or "attributes" in prompt_lower or "informations" in prompt_lower:
            return json.dumps(["Numéro", "Date", "Client", "Montant", "Statut"])
        
        # Actor
        if "actor" in prompt_lower or "acteur" in prompt_lower or "qui réalise" in prompt_lower:
            return json.dumps({
                "name": "Conseiller commercial",
                "type": "personne",
                "role": None
            })
        
        # Rule
        if "règle" in prompt_lower or "rule" in prompt_lower:
            return json.dumps({
                "condition": "montant > 5000€",
                "action": "validation manager requise",
                "type": "SI_ALORS"
            })
        
        # Signal
        if "signal" in prompt_lower or "alerte" in prompt_lower:
            return json.dumps({
                "event": "Budget dépassé",
                "action": "Alerter équipe finance",
                "severity": "MEDIUM",
                "threshold": "10%"
            })
        
        # Pain point
        if "difficulté" in prompt_lower or "problème" in prompt_lower or "pain" in prompt_lower:
            return json.dumps({
                "description": "Processus manuel lent",
                "impact": "temps_perdu",
                "severity": "MEDIUM"
            })
        
        # Réponse par défaut
        return json.dumps({"message": "Réponse mockée - Configurez ANTHROPIC_API_KEY pour utiliser l'API réelle"})
    
    def _clean_json_response(self, text: str) -> str:
        """Nettoie réponse pour extraire JSON propre"""
        text = text.strip()
        # Retirer markdown code blocks
        text = re.sub(r'^```json\s*', '', text, flags=re.MULTILINE)
        text = re.sub(r'^```\s*', '', text, flags=re.MULTILINE)
        text = re.sub(r'\s*```$', '', text, flags=re.MULTILINE)
        # Retirer tout texte avant le premier {
        first_brace = text.find('{')
        if first_brace > 0:
            text = text[first_brace:]
        # Retirer tout texte après le dernier }
        last_brace = text.rfind('}')
        if last_brace >= 0:
            text = text[:last_brace + 1]
        return text.strip()
    
    # =========================================================================
    # PHASE 1: DISCOVERY - Analyse description initiale
    # =========================================================================
    
    def reformulate_user_message(self, user_text: str) -> str:
        """
        Reformule UNIQUEMENT si nécessaire (clarification, normalisation légère)
        Ne reformule PAS si le message est déjà clair et structuré
        """
        # Vérifier si le message nécessite vraiment une reformulation
        # Si c'est déjà clair, retourner tel quel
        if len(user_text.strip()) < 10:
            return user_text.strip()
        
        # Ne reformuler que si vraiment nécessaire (vocabulaire très informel, fautes, etc.)
        prompt = f"""Vous êtes un assistant conversationnel. L'utilisateur a écrit :

"{user_text}"

Votre mission : Reformuler UNIQUEMENT si le message est vraiment confus, contient des fautes importantes, ou est trop informel. Sinon, retournez le message tel quel.

Règles strictes :
- Si le message est déjà clair et compréhensible → retournez-le tel quel
- Reformulez UNIQUEMENT si : vocabulaire très familier, fautes d'orthographe importantes, phrases incomplètes
- Gardez le vocabulaire métier de l'utilisateur
- Ne changez PAS le sens
- Ne reformulez PAS juste pour "améliorer" le style

Répondez UNIQUEMENT avec la reformulation (ou le message original si pas besoin de reformulation). Pas de commentaire, pas d'explication."""

        try:
            response_text = self._call_claude_api(prompt, max_tokens=500)
            return response_text.strip()
        except Exception:
            # En cas d'erreur, retourner le message original
            return user_text.strip()
    
    def analyze_initial_description(self, user_text: str, mode: str = "transformation") -> Dict[str, Any]:
        """
        Analyse description initiale processus
        
        Input: "Le client envoie un email. On vérifie le stock. On fait un devis."
        Output: {
            "activities": [
                {"label": "Recevoir email client", "confidence": 0.9},
                {"label": "Vérifier disponibilité stock", "confidence": 0.95},
                {"label": "Créer devis", "confidence": 0.9}
            ]
        }
        """
        
        mode_instruction = {
            "transformation": "L'utilisateur décrit un processus métier existant (AS-IS). Identifiez les activités actuelles.",
            "decision": "L'utilisateur décrit une décision récurrente qu'il doit prendre. Identifiez les étapes de cette prise de décision."
        }
        
        prompt = f"""Vous êtes un consultant senior expert en transformation métier.

{mode_instruction.get(mode, mode_instruction["transformation"])}

Description utilisateur :
"{user_text}"

Votre mission :
1. Identifier toutes les activités métier mentionnées
2. Reformuler chaque activité de manière claire et professionnelle
3. Garder le vocabulaire métier terrain (pas de jargon technique)
4. Utiliser des verbes d'action à l'infinitif

Retournez UNIQUEMENT un objet JSON (aucun texte avant ou après) :
{{
    "activities": [
        {{"label": "Verbe d'action + complément", "confidence": 0.85}},
        ...
    ]
}}

Exemples de reformulation :
- "le client envoie un mail" → "Recevoir demande client"
- "on regarde le stock" → "Vérifier disponibilité stock"
- "on fait un devis" → "Créer devis client"
- "validation du manager" → "Obtenir validation manager"

IMPORTANT : Répondez UNIQUEMENT avec le JSON, sans texte avant, sans texte après, sans markdown, sans code block.
Commencez directement par {{ et terminez par }}."""

        try:
            response_text = self._call_claude_api(prompt, max_tokens=2000)
            response_text = self._clean_json_response(response_text)
            parsed = json.loads(response_text)
            
            # Valider la structure
            if "activities" not in parsed:
                raise ValueError("Response missing 'activities' field")
            
            if not isinstance(parsed["activities"], list):
                raise ValueError("'activities' must be a list")
            
            return parsed
        except json.JSONDecodeError as e:
            raise ValueError(f"Erreur de parsing JSON : {str(e)}. Réponse reçue : {response_text[:200]}")
        except ValueError:
            # Re-raise les ValueError (déjà formatées par _call_claude_api)
            raise
    
    # =========================================================================
    # PHASE 2: DEEP DIVE - Questions contextuelles
    # =========================================================================
    
    def reformulate_with_concepts(self, user_text: str, question_type: str, context: Dict[str, Any] = None) -> str:
        """
        Reformule la réponse utilisateur en utilisant les concepts métier existants
        Retourne UNIQUEMENT une reformulation en texte simple (pas de JSON)
        IMPORTANT : Ne doit reprendre QUE ce que l'utilisateur a saisi, sans inventer
        Si la réponse est "non" ou équivalent, retourne une chaîne vide
        """
        if context is None:
            context = {}
        
        # Vérifier si la réponse est négative (non, aucune, rien, etc.)
        user_text_lower = user_text.lower().strip()
        negative_responses = ["non", "aucune", "aucun", "rien", "pas de", "ne pas", "non merci", "non merci", "non applicable", "n/a"]
        if any(neg in user_text_lower for neg in negative_responses) and len(user_text_lower) < 20:
            # Réponse négative courte - ne pas reformuler
            return ""
        
        activities = context.get("activities", [])
        business_objects = context.get("business_objects", [])
        actors = context.get("actors", [])
        
        # Construire le contexte des concepts existants
        activities_list = ", ".join([act.get("label", "") for act in activities[:5] if act.get("label")])
        objects_list = ", ".join([obj.get("name", "") for obj in business_objects[:5] if obj.get("name")])
        actors_list = ", ".join([actor.get("name", "") for actor in actors[:5] if actor.get("name")])
        
        question_labels = {
            "trigger": "déclencheur",
            "output": "produit/objet créé",
            "attributes": "attributs",
            "actor": "acteur réalisateur",
            "rules": "règle métier",
            "signals": "signal d'alerte",
            "pain_points": "point de friction"
        }
        
        prompt = f"""Vous êtes un consultant métier. L'utilisateur répond à une question sur le {question_labels.get(question_type, question_type)}.

Réponse utilisateur : "{user_text}"

Concepts métier déjà identifiés :
- Activités : {activities_list if activities_list else "Aucune"}
- Objets métier : {objects_list if objects_list else "Aucun"}
- Acteurs : {actors_list if actors_list else "Aucun"}

Votre mission : Reformuler UNIQUEMENT ce que l'utilisateur a dit, en utilisant un vocabulaire métier professionnel.

Règles STRICTES ET OBLIGATOIRES :
- Reformulez UNIQUEMENT le contenu de la réponse utilisateur, SANS ajouter d'informations
- NE PAS inventer, NE PAS supposer, NE PAS ajouter de détails non mentionnés
- NE PAS halluciner - si l'utilisateur ne mentionne pas quelque chose, ne l'inventez pas
- Si l'utilisateur dit "le client envoie un email", reformulez en "Le client envoie un email" (ou similaire) mais NE PAS ajouter "via le système de messagerie" si ce n'est pas mentionné
- Utilisez le vocabulaire métier cohérent avec les concepts existants UNIQUEMENT si l'utilisateur y fait référence explicitement
- Précisez clairement de quoi il s'agit (événement, objet, acteur, etc.) SEULEMENT si c'est implicite dans la réponse
- Répondez UNIQUEMENT avec une phrase courte et claire (pas de JSON, pas de structure)
- Ne retournez QUE du texte, pas de JSON, pas de code, pas de structure
- Si la réponse est vide ou très courte, retournez une chaîne vide

Réformulation (phrase courte uniquement, basée UNIQUEMENT sur la réponse utilisateur, ou chaîne vide si rien à reformuler) :"""

        try:
            response = self._call_claude_api(prompt, max_tokens=150)
            # Nettoyer la réponse pour s'assurer qu'il n'y a pas de JSON
            cleaned = response.strip()
            
            # Si la réponse est vide ou très courte, retourner vide
            if not cleaned or len(cleaned) < 3:
                return ""
            
            # Si la réponse commence par { ou [, c'est probablement du JSON - extraire le texte
            if cleaned.startswith('{') or cleaned.startswith('['):
                # Essayer d'extraire le texte utile
                import json
                try:
                    parsed = json.loads(cleaned)
                    # Si c'est un dict avec "activities", extraire les labels
                    if isinstance(parsed, dict) and "activities" in parsed:
                        labels = [a.get("label", "") for a in parsed.get("activities", [])]
                        return ", ".join(labels)
                    return str(parsed)
                except:
                    # Si le parsing échoue, retourner le texte original de l'utilisateur
                    return user_text.strip() if user_text.strip() else ""
            
            # Vérifier que la reformulation reprend bien le texte original
            user_words = set(user_text.lower().split())
            reformulated_words = set(cleaned.lower().split())
            if len(user_words.intersection(reformulated_words)) < 2 and len(user_text) > 10:
                # La reformulation ne reprend pas assez le texte original, retourner le texte original
                return user_text.strip() if user_text.strip() else ""
            
            return cleaned
        except Exception:
            # En cas d'erreur, retourner le texte original ou vide
            return user_text.strip() if user_text.strip() else ""
    
    def analyze_trigger(self, user_text: str, activity_label: str) -> Dict[str, Any]:
        """
        Analyse déclencheur d'une activité
        
        Input: "Le client envoie un email avec sa demande"
        Output: {
            "trigger_event": "Email client",
            "trigger_actor": "Client",
            "trigger_actor_type": "personne",
            "trigger_system": "Messagerie"
        }
        """
        
        prompt = f"""Consultant senior : l'utilisateur décrit ce qui déclenche l'activité "{activity_label}".

Réponse utilisateur : "{user_text}"

Extrayez UNIQUEMENT les informations explicitement mentionnées dans la réponse utilisateur.

Règles STRICTES :
- NE PAS inventer, NE PAS supposer, NE PAS inférer
- Si l'utilisateur ne mentionne pas quelque chose, retournez null ou une chaîne vide
- Utilisez les mots exacts de l'utilisateur autant que possible
- Reformulez légèrement uniquement pour normaliser (capitaliser, etc.)

Format JSON :
{{
    "trigger_event": "Événement déclencheur mentionné explicitement (ou null si non mentionné)",
    "trigger_actor": "Qui ou quoi déclenche mentionné explicitement (ou null si non mentionné)",
    "trigger_actor_type": "personne|equipe|systeme (déduit du contexte si clair, sinon null)",
    "trigger_system": "Système mentionné explicitement (ou null si non mentionné)"
}}

Exemples :
- "Le client envoie un email" → {{"trigger_event": "email", "trigger_actor": "client", "trigger_actor_type": "personne", "trigger_system": null}}
- "Le système ERP génère une alerte" → {{"trigger_event": "alerte", "trigger_actor": "système ERP", "trigger_actor_type": "systeme", "trigger_system": "ERP"}}
- "Le manager demande" → {{"trigger_event": "demande", "trigger_actor": "manager", "trigger_actor_type": "personne", "trigger_system": null}}
- "Un email arrive" → {{"trigger_event": "email", "trigger_actor": null, "trigger_actor_type": null, "trigger_system": null}}

IMPORTANT : Répondez UNIQUEMENT avec le JSON, sans texte avant, sans texte après, sans markdown, sans code block.
Commencez directement par {{ et terminez par }}."""

        try:
            response_text = self._call_claude_api(prompt, max_tokens=1000)
            response_text = self._clean_json_response(response_text)
            return json.loads(response_text)
        except json.JSONDecodeError as e:
            raise ValueError(f"Erreur de parsing JSON : {str(e)}. Réponse : {response_text[:200]}")
    
    def analyze_output(self, user_text: str, activity_label: str) -> Dict[str, Any]:
        """
        Analyse output/résultat d'une activité
        
        Input: "Une commande enregistrée dans le CRM"
        Output: {
            "business_object": "Commande",
            "output_system": "CRM",
            "attributes": ["numéro", "date", "client"]
        }
        """
        
        prompt = f"""Consultant senior : l'utilisateur décrit ce qui est produit par "{activity_label}".

Réponse utilisateur : "{user_text}"

Extrayez UNIQUEMENT les informations explicitement mentionnées dans la réponse utilisateur.

Règles STRICTES :
- NE PAS inventer, NE PAS supposer, NE PAS inférer
- Si l'utilisateur ne mentionne pas quelque chose, retournez null ou une liste vide
- Utilisez les mots exacts de l'utilisateur autant que possible
- Reformulez légèrement uniquement pour normaliser (capitaliser, etc.)

Format JSON :
{{
    "business_object": "Nom de l'objet métier mentionné explicitement (ou null si non mentionné)",
    "output_system": "Système mentionné explicitement (CRM, ERP, Excel...) ou null si non mentionné",
    "attributes": ["liste d'attributs UNIQUEMENT s'ils sont explicitement mentionnés, sinon liste vide []"]
}}

Exemples :
- "Une commande dans le CRM" → {{"business_object": "commande", "output_system": "CRM", "attributes": []}}
- "Un devis avec montant et date de validité" → {{"business_object": "devis", "output_system": null, "attributes": ["montant", "date de validité"]}}
- "La facture est générée dans SAP" → {{"business_object": "facture", "output_system": "SAP", "attributes": []}}
- "Une commande" → {{"business_object": "commande", "output_system": null, "attributes": []}}
- "Rien de particulier" → {{"business_object": null, "output_system": null, "attributes": []}}

IMPORTANT : Répondez UNIQUEMENT avec le JSON, sans texte avant, sans texte après, sans markdown, sans code block.
Commencez directement par {{ et terminez par }}."""

        try:
            response_text = self._call_claude_api(prompt, max_tokens=1000)
            response_text = self._clean_json_response(response_text)
            return json.loads(response_text)
        except json.JSONDecodeError as e:
            raise ValueError(f"Erreur de parsing JSON : {str(e)}. Réponse : {response_text[:200]}")
    
    def analyze_attributes(self, user_text: str, business_object: str) -> List[str]:
        """
        Extrait attributs d'un objet métier
        IMPORTANT : Ne retourne des attributs QUE s'ils sont explicitement mentionnés
        
        Input: "nom client, produits demandés, quantités, date de commande"
        Output: ["Nom client", "Produits demandés", "Quantités", "Date de commande"]
        """
        
        # Vérifier si la réponse est négative ou vide
        user_text_lower = user_text.lower().strip()
        negative_responses = ["non", "aucune", "aucun", "rien", "pas de", "ne pas", "non merci", "non applicable", "n/a"]
        if any(neg in user_text_lower for neg in negative_responses) and len(user_text_lower) < 20:
            return []
        
        prompt = f"""L'utilisateur répond à une question sur les attributs de l'objet métier "{business_object}".

Réponse : "{user_text}"

Extrayez UNIQUEMENT les attributs explicitement mentionnés dans la réponse.
Si aucun attribut n'est mentionné explicitement, retournez une liste vide [].

Règles STRICTES :
- Ne retournez QUE les attributs explicitement mentionnés
- NE PAS inventer ou supposer des attributs
- Si l'utilisateur dit "je ne sais pas" ou "non", retournez []
- Si l'utilisateur liste des attributs, extrayez-les

Retournez une liste JSON uniquement :
["Attribut 1", "Attribut 2", ...] ou [] si aucun attribut mentionné

Normalisez légèrement (capitaliser première lettre) mais gardez le vocabulaire métier terrain.

Exemples :
- "nom, prénom, email" → ["Nom", "Prénom", "Email"]
- "montant TTC, date commande, statut" → ["Montant TTC", "Date commande", "Statut"]
- "je ne sais pas" → []
- "non" → []

Liste JSON uniquement (aucun texte avant ou après) :"""

        try:
            response_text = self._call_claude_api(prompt, max_tokens=500)
            response_text = self._clean_json_response(response_text)
            result = json.loads(response_text)
            # S'assurer que c'est une liste
            if isinstance(result, list):
                return result
            return []
        except json.JSONDecodeError as e:
            # En cas d'erreur, retourner une liste vide plutôt que d'élever une exception
            return []
    
    def analyze_actor(self, user_text: str) -> Dict[str, Any]:
        """
        Extrait acteur réalisateur
        
        Input: "Le conseiller commercial"
        Output: {
            "name": "Conseiller commercial",
            "type": "personne",
            "role": null
        }
        """
        
        prompt = f"""L'utilisateur indique qui ou quel système réalise l'activité : "{user_text}"

Extrayez UNIQUEMENT les informations explicitement mentionnées dans la réponse utilisateur.

Règles STRICTES :
- NE PAS inventer, NE PAS supposer, NE PAS inférer
- Si l'utilisateur ne mentionne pas quelque chose, retournez null
- Utilisez les mots exacts de l'utilisateur autant que possible
- Le type doit être déduit uniquement si c'est clair dans la réponse (personne, équipe, système)

Format JSON :
{{
    "name": "Nom de l'acteur ou système mentionné explicitement (ou null si non mentionné)",
    "type": "personne|equipe|systeme (déduit uniquement si clair, sinon 'personne' par défaut)",
    "role": "Rôle mentionné explicitement (ou null si non mentionné)"
}}

Exemples :
- "Le conseiller commercial" → {{"name": "conseiller commercial", "type": "personne", "role": null}}
- "L'équipe logistique s'en occupe" → {{"name": "équipe logistique", "type": "equipe", "role": null}}
- "Le système ERP automatiquement" → {{"name": "système ERP", "type": "systeme", "role": null}}
- "Le manager qui valide" → {{"name": "manager", "type": "personne", "role": "valide"}}
- "Personne en particulier" → {{"name": null, "type": "personne", "role": null}}

IMPORTANT : Répondez UNIQUEMENT avec le JSON, sans texte avant, sans texte après, sans markdown, sans code block.
Commencez directement par {{ et terminez par }}."""

        try:
            response_text = self._call_claude_api(prompt, max_tokens=500)
            response_text = self._clean_json_response(response_text)
            return json.loads(response_text)
        except json.JSONDecodeError as e:
            raise ValueError(f"Erreur de parsing JSON : {str(e)}. Réponse : {response_text[:200]}")
    
    def analyze_rule(self, user_text: str) -> Optional[Dict[str, Any]]:
        """
        Extrait règle métier
        
        Input: "Si montant > 5000€, validation du directeur obligatoire"
        Output: {
            "condition": "montant > 5000€",
            "action": "validation directeur requise",
            "type": "SI_ALORS"
        }
        """
        
        if not user_text.strip() or user_text.lower() in ["non", "aucune", "pas de règle", "rien"]:
            return None
        
        prompt = f"""L'utilisateur décrit une règle métier : "{user_text}"

Extrayez UNIQUEMENT les informations explicitement mentionnées dans la réponse utilisateur.

Règles STRICTES :
- NE PAS inventer, NE PAS supposer, NE PAS inférer
- Utilisez les mots exacts de l'utilisateur autant que possible
- Reformulez légèrement uniquement pour normaliser

Format JSON :
{{
    "condition": "Condition mentionnée explicitement (partie SI...)",
    "action": "Action mentionnée explicitement (partie ALORS...)",
    "type": "SI_ALORS|TANT_QUE (déduit uniquement si clair, sinon 'SI_ALORS' par défaut)"
}}

Exemples :
- "Si montant > 5000€, validation manager obligatoire" → {{"condition": "montant > 5000€", "action": "validation manager obligatoire", "type": "SI_ALORS"}}
- "Tant que budget non validé, bloquer les dépenses" → {{"condition": "budget non validé", "action": "bloquer les dépenses", "type": "TANT_QUE"}}
- "Clients nouveaux nécessitent validation crédit" → {{"condition": "clients nouveaux", "action": "validation crédit", "type": "SI_ALORS"}}

Si aucune règle détectable ou réponse négative, retournez null.

IMPORTANT : Répondez UNIQUEMENT avec le JSON, sans texte avant, sans texte après, sans markdown, sans code block.
Commencez directement par {{ et terminez par }}."""

        try:
            response_text = self._call_claude_api(prompt, max_tokens=500)
            response_text = self._clean_json_response(response_text)
            
            if "null" in response_text.lower():
                return None
            
            return json.loads(response_text)
        except json.JSONDecodeError as e:
            raise ValueError(f"Erreur de parsing JSON : {str(e)}. Réponse : {response_text[:200]}")
    
    def analyze_signal(self, user_text: str) -> Optional[Dict[str, Any]]:
        """
        Extrait signal d'alerte
        
        Input: "Si budget dépassé de 10%, alerter le directeur"
        Output: {
            "event": "Budget dépassé",
            "action": "Alerter directeur",
            "severity": "HIGH",
            "threshold": "10%"
        }
        """
        
        if not user_text.strip() or user_text.lower() in ["non", "aucun", "rien", "pas d'alerte"]:
            return None
        
        prompt = f"""L'utilisateur décrit un signal d'alerte / événement à surveiller : "{user_text}"

Extrayez UNIQUEMENT les informations explicitement mentionnées dans la réponse utilisateur.

Règles STRICTES :
- NE PAS inventer, NE PAS supposer, NE PAS inférer
- Utilisez les mots exacts de l'utilisateur autant que possible
- Reformulez légèrement uniquement pour normaliser

Format JSON :
{{
    "event": "Événement mentionné explicitement (ou null si non mentionné)",
    "action": "Action mentionnée explicitement (ou null si non mentionnée)",
    "severity": "HIGH|MEDIUM|LOW (déduit uniquement si clair dans la réponse, sinon 'MEDIUM' par défaut)",
    "threshold": "Seuil mentionné explicitement (ex: '10%', '5000€') ou null si non mentionné"
}}

Règles de sévérité (déduire uniquement si clair) :
- HIGH : mots comme "urgent", "critique", "immédiat", "bloquant"
- MEDIUM : mots comme "important", "rapidement", "surveiller" ou par défaut
- LOW : autres cas

Exemples :
- "Si budget dépassé de 10%, alerter finance" → {{"event": "budget dépassé", "action": "alerter finance", "severity": "HIGH", "threshold": "10%"}}
- "Retard de livraison > 2 jours" → {{"event": "retard de livraison", "action": null, "severity": "MEDIUM", "threshold": "2 jours"}}

Si rien à extraire ou réponse négative, retournez null.

IMPORTANT : Répondez UNIQUEMENT avec le JSON, sans texte avant, sans texte après, sans markdown, sans code block.
Commencez directement par {{ et terminez par }}."""

        try:
            response_text = self._call_claude_api(prompt, max_tokens=500)
            response_text = self._clean_json_response(response_text)
            
            if "null" in response_text.lower():
                return None
            
            return json.loads(response_text)
        except json.JSONDecodeError as e:
            raise ValueError(f"Erreur de parsing JSON : {str(e)}. Réponse : {response_text[:200]}")
    
    def analyze_pain_point(self, user_text: str) -> Optional[Dict[str, Any]]:
        """
        Extrait point de friction
        
        Input: "Parfois les emails arrivent dans les spams et on perd des demandes"
        Output: {
            "description": "Emails perdus dans spam",
            "impact": "temps_perdu",
            "severity": "MEDIUM"
        }
        """
        
        if not user_text.strip() or user_text.lower() in ["non", "rien", "aucun", "pas de problème"]:
            return None
        
        prompt = f"""L'utilisateur décrit un problème / point de friction : "{user_text}"

Extrayez UNIQUEMENT les informations explicitement mentionnées dans la réponse utilisateur.

Règles STRICTES :
- NE PAS inventer, NE PAS supposer, NE PAS inférer
- Utilisez les mots exacts de l'utilisateur autant que possible
- Reformulez légèrement uniquement pour normaliser

Format JSON :
{{
    "description": "Description du problème mentionnée explicitement (ou null si non mentionné)",
    "impact": "temps_perdu|erreurs|frustration|cout|risque (déduit uniquement si clair, sinon 'temps_perdu' par défaut)",
    "severity": "HIGH|MEDIUM|LOW (déduit uniquement si clair, sinon 'MEDIUM' par défaut)"
}}

Exemples :
- "Les emails se perdent dans les spams" → {{"description": "emails se perdent dans les spams", "impact": "temps_perdu", "severity": "MEDIUM"}}
- "Erreurs fréquentes de saisie manuelle" → {{"description": "erreurs fréquentes de saisie manuelle", "impact": "erreurs", "severity": "HIGH"}}
- "Processus très lent et frustrant" → {{"description": "processus très lent et frustrant", "impact": "frustration", "severity": "MEDIUM"}}

Si rien à extraire ou réponse négative, retournez null.

IMPORTANT : Répondez UNIQUEMENT avec le JSON, sans texte avant, sans texte après, sans markdown, sans code block.
Commencez directement par {{ et terminez par }}."""

        try:
            response_text = self._call_claude_api(prompt, max_tokens=500)
            response_text = self._clean_json_response(response_text)
            
            if "null" in response_text.lower():
                return None
            
            return json.loads(response_text)
        except json.JSONDecodeError as e:
            raise ValueError(f"Erreur de parsing JSON : {str(e)}. Réponse : {response_text[:200]}")
    
    # =========================================================================
    # GÉNÉRATION QUESTIONS CONTEXTUELLES
    # =========================================================================
    
    def generate_follow_up_question(
        self, 
        activity_label: str, 
        question_type: str
    ) -> str:
        """Génère question de deep dive selon le type"""
        
        questions = {
            "trigger": f"Qu'est-ce qui déclenche l'activité '{activity_label}' ?",
            "output": f"Qu'est-ce qui est produit ou créé par '{activity_label}' ?",
            "attributes": f"Quelles informations sont nécessaires pour réaliser '{activity_label}' ?",
            "actor": f"Qui ou quel système réalise '{activity_label}' ? (Indiquez si c'est une personne, une équipe ou un système)",
            "rules": f"Y a-t-il des règles métier à respecter pour '{activity_label}' ? (Dites 'non' si aucune)",
            "signals": f"Quand faut-il être alerté concernant '{activity_label}' ? (Dites 'non' si jamais)",
            "pain_points": f"Quelles sont les difficultés rencontrées avec '{activity_label}' ? (Dites 'non' si aucune)"
        }
        
        return questions.get(question_type, "Pouvez-vous m'en dire plus ?")

