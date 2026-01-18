"""Module de génération d'architecture v0 pour Aura"""
from typing import Dict, List, Any, Optional
import re
from .storage import read_json, write_json

# Stockage des capabilities générées
CAPABILITIES: Dict[str, Dict[str, Any]] = {}  # capability_id -> capability


def normalize_text(text: str) -> str:
    """Normalise un texte pour génération de noms"""
    if not text:
        return ""
    # Nettoyer et normaliser
    text = text.strip().lower()
    # Remplacer caractères spéciaux
    text = re.sub(r'[^\w\s]', '', text)
    # Remplacer espaces multiples
    text = re.sub(r'\s+', ' ', text)
    return text


def infer_capability_l3(process_state: Dict[str, str]) -> List[Dict[str, Any]]:
    """Infère des capabilities L3 depuis un process state"""
    capabilities = []
    
    command = normalize_text(process_state.get("command", ""))
    business_object = normalize_text(process_state.get("business_object", ""))
    event = normalize_text(process_state.get("event", ""))
    reaction = normalize_text(process_state.get("reaction", ""))
    actor = normalize_text(process_state.get("actor", ""))
    systems = process_state.get("systems", "")
    
    # Règle principale : Capability = command + business_object
    if command and business_object:
        cap_name = f"{command} {business_object}"
        confidence = 85
        evidence_fields = ["command", "business_object"]
    elif event and business_object:
        cap_name = f"{event} {business_object}"
        confidence = 65
        evidence_fields = ["event", "business_object"]
    elif event:
        cap_name = event
        confidence = 50
        evidence_fields = ["event"]
    else:
        return []  # Pas assez d'info
    
    # Pénalité si champs vagues
    if len(command) <= 3 or command in ["n/a", "na", ""]:
        confidence -= 10
    if len(business_object) <= 3 or business_object in ["n/a", "na", ""]:
        confidence -= 10
    
    confidence = max(30, min(100, confidence))
    
    # Créer la capability principale
    cap_id = f"cap_{hash(cap_name) % 1000000}"
    capability = {
        "id": cap_id,
        "name": cap_name.title(),
        "level": 3,
        "status": "CANDIDATE",
        "confidence": confidence,
        "evidence": {
            "process_id": process_state.get("_process_id", ""),
            "interview_fields_used": evidence_fields,
            "snippets": [process_state.get(f) for f in evidence_fields if process_state.get(f)]
        },
        "linked_actors": [actor] if actor else [],
        "linked_apps": [s.strip() for s in systems.split(",") if s.strip()] if systems else []
    }
    capabilities.append(capability)
    
    # Si reaction présente, créer capability aval
    if reaction:
        reaction_cap_name = f"{reaction} {business_object}" if business_object else reaction
        reaction_cap_id = f"cap_{hash(reaction_cap_name) % 1000000}"
        reaction_capability = {
            "id": reaction_cap_id,
            "name": reaction_cap_name.title(),
            "level": 3,
            "status": "CANDIDATE",
            "confidence": max(50, confidence - 15),
            "evidence": {
                "process_id": process_state.get("_process_id", ""),
                "interview_fields_used": ["reaction", "business_object"],
                "snippets": [reaction, business_object]
            },
            "linked_actors": [],
            "linked_apps": []
        }
        capabilities.append(reaction_capability)
    
    return capabilities


def group_capabilities_l2_l1(capabilities_l3: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    """Regroupe les capabilities L3 en L2 et L1 (heuristique simple)"""
    # L2 = cluster par business_object principal
    l2_groups: Dict[str, List[Dict[str, Any]]] = {}
    
    for cap in capabilities_l3:
        # Extraire le business_object depuis le nom ou l'evidence
        business_object = ""
        for snippet in cap.get("evidence", {}).get("snippets", []):
            if "object" in snippet.lower() or len(snippet.split()) <= 2:
                business_object = snippet
                break
        
        if not business_object:
            business_object = "Autre"
        
        if business_object not in l2_groups:
            l2_groups[business_object] = []
        l2_groups[business_object].append(cap)
    
    # L1 = "Domaine principal" (simplifié pour v0)
    return {
        "L1": [{"id": "l1_main", "name": "Domaine principal", "level": 1, "children": list(l2_groups.keys())}],
        "L2": [
            {
                "id": f"l2_{hash(k) % 1000000}",
                "name": k.title(),
                "level": 2,
                "children": [c["id"] for c in v]
            }
            for k, v in l2_groups.items()
        ],
        "L3": capabilities_l3
    }


def sanitize_mermaid_id(text: str) -> str:
    """Nettoie un texte pour être utilisé comme ID Mermaid (pas de caractères spéciaux)"""
    if not text:
        return "node"
    # Remplacer caractères spéciaux par underscore
    cleaned = re.sub(r'[^\w]', '_', str(text))
    # Limiter la longueur
    return cleaned[:30] if len(cleaned) > 30 else cleaned


def build_functional_static_mermaid(process_state: Dict[str, Any], capabilities: List[Dict[str, Any]]) -> str:
    """Construit un diagramme Mermaid fonctionnel statique (robuste, style Ardoq)"""
    try:
        actor = process_state.get("actor", "Acteur") or "Acteur"
        systems = []
        if process_state.get("systems"):
            systems = [s.strip() for s in str(process_state.get("systems", "")).split(",") if s.strip()]
        
        lines = ["flowchart TD"]
        
        # Style classes pour objets arrondis (Ardoq style)
        lines.append("    classDef rounded fill:#0f172a,stroke:#0f172a,stroke-width:2px,color:#fff,rx:12px,ry:12px")
        lines.append("    classDef capability fill:#3b82f6,stroke:#2563eb,stroke-width:2px,color:#fff,rx:12px,ry:12px")
        lines.append("    classDef application fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff,rx:12px,ry:12px")
        lines.append("    classDef event fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff,rx:12px,ry:12px")
        
        # Acteur externe
        actor_id = sanitize_mermaid_id(actor)
        lines.append(f'    {actor_id}["🧑 {actor}"]')
        lines.append(f'    class {actor_id} rounded')
        
        # Capabilities
        if capabilities:
            for cap in capabilities:
                cap_id = sanitize_mermaid_id(cap.get("id", ""))
                cap_name = cap.get("name", "Capability") or "Capability"
                lines.append(f'    {cap_id}["🧠 {cap_name}"]')
                lines.append(f'    class {cap_id} capability')
                lines.append(f'    {actor_id} -->|initie| {cap_id}')
            
            # Réactions (liens entre capabilities)
            reaction = process_state.get("reaction", "")
            if reaction and len(capabilities) > 1:
                cap1_id = sanitize_mermaid_id(capabilities[0].get("id", ""))
                cap2_id = sanitize_mermaid_id(capabilities[1].get("id", ""))
                lines.append(f'    {cap1_id} -->|déclenche| {cap2_id}')
        
        # Applications
        if systems:
            lines.append('    subgraph Applications["Applications"]')
            for sys in systems:
                sys_id = sanitize_mermaid_id(sys)
                lines.append(f'        {sys_id}["{sys}"]')
            lines.append('    end')
            
            # Lier capabilities aux apps
            if capabilities:
                for cap in capabilities:
                    cap_id = sanitize_mermaid_id(cap.get("id", ""))
                    for sys in systems:
                        sys_id = sanitize_mermaid_id(sys)
                        lines.append(f'    {cap_id} -.->|réalise| {sys_id}')
        
        return "\n".join(lines)
    except Exception as e:
        # Fallback si erreur
        return f"flowchart TD\n    Error[\"Erreur de génération: {str(e)}\"]"


def build_functional_dynamic_mermaid(process_state: Dict[str, Any], events: Optional[List[Dict[str, Any]]] = None) -> str:
    """Construit un diagramme Mermaid fonctionnel dynamique (sequence) - robuste"""
    try:
        actor = process_state.get("actor", "Acteur") or "Acteur"
        systems = []
        if process_state.get("systems"):
            systems = [s.strip() for s in str(process_state.get("systems", "")).split(",") if s.strip()]
        
        # Si on a des événements, les utiliser
        if events:
            # Extraire les applications depuis les événements
            app_set = set()
            for event in events:
                if event.get("application"):
                    app_set.add(event.get("application"))
            if app_set:
                systems = list(app_set)
        
        lines = ["sequenceDiagram"]
        lines.append(f'    participant Actor as {actor}')
        
        for sys in systems:
            sys_id = sanitize_mermaid_id(sys)
            lines.append(f'    participant {sys_id} as {sys}')
        
        if events and len(events) > 0:
            # Utiliser les événements pour construire la séquence
            for i, event in enumerate(events[:5]):  # Limiter à 5 événements
                event_label = event.get("label", "Événement")
                app = event.get("application")
                if app and systems:
                    app_id = sanitize_mermaid_id(app)
                    if i == 0:
                        lines.append(f'    Actor->>{app_id}: {event_label}')
                    else:
                        prev_app = events[i-1].get("application")
                        if prev_app:
                            prev_app_id = sanitize_mermaid_id(prev_app)
                            lines.append(f'    {prev_app_id}->>{app_id}: {event_label}')
        elif systems:
            command = process_state.get("command", "Commande") or "Commande"
            event = process_state.get("event", "Événement") or "Événement"
            sys_id = sanitize_mermaid_id(systems[0])
            lines.append(f'    Actor->>{sys_id}: {command}')
            lines.append(f'    {sys_id}-->>Actor: {event}')
            
            reaction = process_state.get("reaction", "")
            if reaction and len(systems) > 1:
                sys2_id = sanitize_mermaid_id(systems[1])
                lines.append(f'    {sys_id}->>{sys2_id}: {reaction}')
        
        return "\n".join(lines)
    except Exception as e:
        return f"sequenceDiagram\n    participant Error\n    Error->>Error: Erreur de génération: {str(e)}"


def build_integration_mermaid(process_state: Dict[str, Any], capabilities: List[Dict[str, Any]], events: Optional[List[Dict[str, Any]]] = None) -> str:
    """Construit un diagramme Mermaid d'intégration - robuste"""
    try:
        systems = []
        if process_state.get("systems"):
            systems = [s.strip() for s in str(process_state.get("systems", "")).split(",") if s.strip()]
        
        # Si on a des événements, extraire les applications
        if events:
            app_set = set()
            for event in events:
                if event.get("application"):
                    app_set.add(event.get("application"))
            if app_set:
                systems = list(app_set)
        
        if not systems or len(systems) < 2:
            return "graph LR\n    A[\"Aucune intégration détectée\"]"
        
        lines = ["graph LR"]
        
        # Créer les nœuds systèmes
        sys_ids = []
        for i, sys in enumerate(systems):
            sys_id = sanitize_mermaid_id(f"Sys{i+1}_{sys}")
            sys_ids.append(sys_id)
            lines.append(f'    {sys_id}["{sys}"]')
        
        # Flux entre systèmes basés sur les événements
        if events:
            # Créer des liens basés sur l'ordre des événements
            for i in range(len(events) - 1):
                event1 = events[i]
                event2 = events[i + 1]
                app1 = event1.get("application")
                app2 = event2.get("application")
                
                if app1 and app2 and app1 != app2:
                    try:
                        idx1 = systems.index(app1)
                        idx2 = systems.index(app2)
                        sys1_id = sys_ids[idx1]
                        sys2_id = sys_ids[idx2]
                        event_label = event2.get("label", "Événement")
                        lines.append(f'    {sys1_id} -->|"{event_label}"| {sys2_id}')
                    except (ValueError, IndexError):
                        pass
        else:
            # Fallback : liens séquentiels
            business_object = process_state.get("business_object", "Objet") or "Objet"
            event = process_state.get("event", "Événement") or "Événement"
            for i in range(len(sys_ids) - 1):
                annotation = f"{business_object} / {event}"
                lines.append(f'    {sys_ids[i]} -->|"{annotation}"<br/>conf: 75%| {sys_ids[i+1]}')
        
        return "\n".join(lines)
    except Exception as e:
        return f"graph LR\n    Error[\"Erreur: {str(e)}\"]"


def generate_architecture_from_events(
    events: List[Dict[str, Any]],
    capabilities: List[Dict[str, Any]],
    applications: List[Dict[str, Any]],
    policies: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Génère l'architecture depuis la chaîne d'événements (nouveau format déterministe).
    """
    try:
        # Extraire les applications uniques
        app_names = [app.get("name", "") for app in applications if app.get("name")]
        if not app_names:
            # Fallback : extraire depuis les événements
            app_set = set()
            for event in events:
                if event.get("application"):
                    app_set.add(event.get("application"))
            app_names = list(app_set)
        
        # Construire un process_state minimal pour compatibilité
        process_state = {
            "actor": "Système métier",  # Inféré
            "systems": ", ".join(app_names) if app_names else "",
            "command": events[0].get("label", "Commande") if events else "Commande",
            "event": events[-1].get("label", "Événement") if events else "Événement",
            "business_object": "Objet métier",  # Inféré depuis événements
        }
        
        # Générer les diagrammes
        functional_static = build_functional_static_mermaid(process_state, capabilities)
        functional_dynamic = build_functional_dynamic_mermaid(process_state, events)
        integration = build_integration_mermaid(process_state, capabilities, events)
        
        # Construire la trace
        trace_items = []
        for cap in capabilities:
            trace_items.append({
                "kind": "CAPABILITY",
                "ref_id": cap.get("id", ""),
                "status": cap.get("status", "VALIDATED"),
                "confidence": cap.get("confidence", 75),
                "evidence": cap.get("evidence", [])
            })
        
        return {
            "functional_static_mermaid": functional_static,
            "functional_dynamic_mermaid": functional_dynamic,
            "integration_mermaid": integration,
            "app_coverage": {
                cap.get("id", ""): cap.get("linked_applications", [])
                for cap in capabilities
            },
            "trace": {"items": trace_items}
        }
    except Exception as e:
        # Fallback en cas d'erreur
        return {
            "functional_static_mermaid": f"flowchart TD\n    Error[\"Erreur: {str(e)}\"]",
            "functional_dynamic_mermaid": f"sequenceDiagram\n    Error->>Error: {str(e)}",
            "integration_mermaid": f"graph LR\n    Error[\"Erreur: {str(e)}\"]",
            "app_coverage": {},
            "trace": {"items": []}
        }


def generate_architecture_package(initiative_id: Optional[str] = None, process_id: Optional[str] = None) -> Dict[str, Any]:
    """Génère un package d'architecture complet (amélioré pour support événements)"""
    from .main import PROCESSES, load_initiatives
    
    # Récupérer les processes
    processes_to_use = []
    
    if initiative_id:
        initiatives = load_initiatives()
        for init in initiatives:
            if init.get("id") == initiative_id:
                for pid in init.get("linked_process_ids", []):
                    if pid in PROCESSES:
                        processes_to_use.append(PROCESSES[pid])
                break
    
    if process_id and process_id in PROCESSES:
        if PROCESSES[process_id] not in processes_to_use:
            processes_to_use.append(PROCESSES[process_id])
    
    if not processes_to_use:
        raise ValueError("No processes found for generation")
    
    # Vérifier si on a des données d'interview déterministe
    main_process = processes_to_use[0]
    interview_data = (main_process.state or {}).get("interview_data", {})
    
    if interview_data and interview_data.get("events"):
        # Utiliser le nouveau format (événements)
        events = interview_data.get("events", [])
        capabilities = interview_data.get("capabilities", [])
        applications = interview_data.get("applications", [])
        policies = interview_data.get("policies", [])
        
        arch_data = generate_architecture_from_events(events, capabilities, applications, policies)
        
        # Grouper capabilities en L2/L1 si possible
        hierarchy = group_capabilities_l2_l1(capabilities) if capabilities else {"L3": capabilities}
        
        package = {
            "id": f"arch_{hash(str(initiative_id or process_id)) % 1000000}",
            "initiative_id": initiative_id,
            "process_id": process_id,
            "generated_at": __import__("datetime").datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "capability_map": hierarchy,
            **arch_data
        }
    else:
        # Ancien format (process_state)
        all_capabilities = []
        for process in processes_to_use:
            state = {**(process.state or {}), "_process_id": process.id}
            caps = infer_capability_l3(state)
            all_capabilities.extend(caps)
        
        hierarchy = group_capabilities_l2_l1(all_capabilities)
        main_state = {**(main_process.state or {})}
        
        functional_static = build_functional_static_mermaid(main_state, all_capabilities)
        functional_dynamic = build_functional_dynamic_mermaid(main_state)
        integration = build_integration_mermaid(main_state, all_capabilities)
        
        trace_items = []
        for cap in all_capabilities:
            trace_items.append({
                "kind": "CAPABILITY",
                "ref_id": cap["id"],
                "status": cap.get("status", "CANDIDATE"),
                "confidence": cap.get("confidence", 75),
                "evidence": cap.get("evidence", {})
            })
        
        package = {
            "id": f"arch_{hash(str(initiative_id or process_id)) % 1000000}",
            "initiative_id": initiative_id,
            "process_id": process_id,
            "generated_at": __import__("datetime").datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "capability_map": hierarchy,
            "functional_static_mermaid": functional_static,
            "functional_dynamic_mermaid": functional_dynamic,
            "app_coverage": {
                cap["id"]: cap.get("linked_apps", [])
                for cap in all_capabilities
            },
            "integration_mermaid": integration,
            "trace": {"items": trace_items}
        }
    
    # Sauvegarder
    packages = read_json("architecture_packages.json", default=[])
    packages.append(package)
    write_json("architecture_packages.json", packages)
    
    return package

