"""Service de détection de domaines métier"""
from typing import List, Set
from ..models.transforming_interview import Activity, BusinessDomain

class DomainDetector:
    """Détecte domaines métier depuis activités"""
    
    DOMAIN_KEYWORDS = {
        "Ventes & Commercial": [
            "vente", "commercial", "devis", "proposition", "client", "prospect",
            "commande", "offre", "négociation", "contrat"
        ],
        "Finance & Comptabilité": [
            "facture", "paiement", "comptabilité", "budget", "trésorerie",
            "crédit", "débit", "règlement", "compte"
        ],
        "Logistique & Supply Chain": [
            "livraison", "expédition", "stock", "approvisionnement", "entrepôt",
            "transport", "réception", "préparation"
        ],
        "Production & Opérations": [
            "production", "fabrication", "assemblage", "manufacture",
            "atelier", "opération", "transformation"
        ],
        "Service Client": [
            "réclamation", "sav", "support", "assistance", "ticket", "incident",
            "demande", "plainte"
        ],
        "Ressources Humaines": [
            "recrutement", "embauche", "formation", "paie", "congé", "absence",
            "évaluation", "performance"
        ],
        "Marketing & Communication": [
            "campagne", "communication", "marketing", "publicité", "promotion",
            "événement", "newsletter"
        ],
        "Qualité & Conformité": [
            "contrôle", "qualité", "audit", "conformité", "certification",
            "norme", "inspection", "validation"
        ],
        "IT & Systèmes": [
            "système", "application", "logiciel", "serveur", "base de données",
            "infrastructure", "réseau"
        ]
    }
    
    def detect_domains(self, activities: List[Activity]) -> List[BusinessDomain]:
        """Détecte domaines"""
        domain_activities = {}
        
        for activity in activities:
            text = f"{activity.label} {activity.description or ''}".lower()
            detected_domains = self._detect_domains_for_text(text)
            
            if not detected_domains:
                detected_domains = ["Activités Générales"]
            
            for domain_name in detected_domains:
                if domain_name not in domain_activities:
                    domain_activities[domain_name] = []
                domain_activities[domain_name].append(activity.id)
        
        domains = []
        for domain_name, activity_ids in domain_activities.items():
            domain = BusinessDomain(
                id=f"domain_{domain_name.lower().replace(' ', '_').replace('&', 'et')}",
                name=domain_name,
                activities=activity_ids,
                description=self._get_domain_description(domain_name)
            )
            domains.append(domain)
        
        return domains
    
    def _detect_domains_for_text(self, text: str) -> Set[str]:
        """Détecte domaines depuis texte"""
        detected = set()
        
        for domain_name, keywords in self.DOMAIN_KEYWORDS.items():
            for keyword in keywords:
                if keyword in text:
                    detected.add(domain_name)
                    break
        
        return detected
    
    def _get_domain_description(self, domain_name: str) -> str:
        """Description domaine"""
        descriptions = {
            "Ventes & Commercial": "Activités liées à la prospection, vente et relation client",
            "Finance & Comptabilité": "Gestion financière, facturation et comptabilité",
            "Logistique & Supply Chain": "Gestion des flux physiques et approvisionnements",
            "Production & Opérations": "Fabrication, transformation et opérations",
            "Service Client": "Support, assistance et gestion des réclamations",
            "Ressources Humaines": "Gestion du personnel et développement RH",
            "Marketing & Communication": "Communication, promotion et marketing",
            "Qualité & Conformité": "Contrôle qualité et respect des normes",
            "IT & Systèmes": "Infrastructure technique et systèmes d'information",
            "Activités Générales": "Activités transverses ou non classées"
        }
        return descriptions.get(domain_name, "")

