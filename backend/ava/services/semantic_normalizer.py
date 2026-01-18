"""Service de normalisation sémantique"""
from typing import Dict, List, Tuple, Set
import re

class SemanticNormalizer:
    """Normalise vocabulaire terrain → concepts ontologiques"""
    
    # =========================================================================
    # MAPPING VERBES TERRAIN → VERBES ONTOLOGIQUES
    # =========================================================================
    
    VERB_NORMALIZATION = {
        # Communication
        "envoyer": "notifier",
        "transmettre": "communiquer",
        "informer": "notifier",
        "alerter": "notifier",
        "prévenir": "notifier",
        "appeler": "contacter",
        "téléphoner": "contacter",
        "mailer": "notifier",
        "emailer": "notifier",
        
        # Validation
        "valider": "approuver",
        "vérifier": "contrôler",
        "checker": "contrôler",
        "contrôler": "contrôler",
        "auditer": "contrôler",
        "inspecter": "contrôler",
        
        # Création
        "créer": "initialiser",
        "générer": "créer",
        "produire": "créer",
        "fabriquer": "créer",
        "construire": "créer",
        "monter": "assembler",
        
        # Traitement
        "traiter": "traiter",
        "gérer": "gérer",
        "s'occuper de": "traiter",
        "prendre en charge": "traiter",
        
        # Stockage
        "sauvegarder": "persister",
        "enregistrer": "persister",
        "stocker": "persister",
        "archiver": "archiver",
        
        # Consultation
        "regarder": "consulter",
        "voir": "consulter",
        "lire": "consulter",
        
        # Modification
        "modifier": "mettre_à_jour",
        "changer": "mettre_à_jour",
        "mettre à jour": "mettre_à_jour",
        "corriger": "mettre_à_jour",
        "ajuster": "mettre_à_jour",
        
        # Suppression
        "supprimer": "supprimer",
        "effacer": "supprimer",
        "retirer": "supprimer",
        "annuler": "annuler",
        
        # Calcul
        "calculer": "calculer",
        "compter": "calculer",
        "chiffrer": "calculer",
        "évaluer": "estimer",
        
        # Recherche
        "chercher": "rechercher",
        "trouver": "rechercher",
        
        # Décision
        "décider": "décider",
        "choisir": "sélectionner",
        "arbitrer": "décider",
    }
    
    # =========================================================================
    # MAPPING OBJETS MÉTIER TERRAIN → CONCEPTS CANONIQUES
    # =========================================================================
    
    ENTITY_NORMALIZATION = {
        # Client / Prospect
        "client": "Client",
        "clients": "Client",
        "customer": "Client",
        "acheteur": "Client",
        "prospect": "Prospect",
        "lead": "Prospect",
        
        # Commande
        "commande": "Commande",
        "commandes": "Commande",
        "order": "Commande",
        "bon de commande": "Commande",
        "bdc": "Commande",
        
        # Facture
        "facture": "Facture",
        "factures": "Facture",
        "invoice": "Facture",
        
        # Paiement
        "paiement": "Paiement",
        "règlement": "Paiement",
        "payment": "Paiement",
        "versement": "Paiement",
        
        # Produit
        "produit": "Produit",
        "produits": "Produit",
        "article": "Produit",
        "articles": "Produit",
        "item": "Produit",
        "référence": "Produit",
        "sku": "Produit",
        
        # Stock
        "stock": "Stock",
        "inventory": "Stock",
        "inventaire": "Stock",
        
        # Livraison
        "livraison": "Livraison",
        "delivery": "Livraison",
        "expédition": "Livraison",
        "shipping": "Livraison",
        
        # Ticket / Réclamation
        "ticket": "Ticket",
        "réclamation": "Réclamation",
        "plainte": "Réclamation",
        "incident": "Incident",
        
        # Documents
        "document": "Document",
        "fichier": "Document",
        "pièce jointe": "Document",
        
        # Email
        "email": "Email",
        "mail": "Email",
        "message": "Message",
        
        # Devis
        "devis": "Devis",
        "quote": "Devis",
        "proposition": "Proposition",
        
        # Contrat
        "contrat": "Contrat",
        "contract": "Contrat",
        "accord": "Contrat",
    }
    
    # =========================================================================
    # PATTERNS SYNTAXIQUES
    # =========================================================================
    
    ACTIVITY_PATTERNS = [
        r"(?P<verb>\w+)\s+(?:un|une|le|la|les|des)?\s*(?P<entity>\w+)",
        r"(?P<entity>\w+)\s+(?P<verb>\w+ée?s?)",
        r"(?P<verb>\w+)\s+(?:le|la|l')?\s*(?P<entity>\w+)",
    ]
    
    # =========================================================================
    # MÉTHODES
    # =========================================================================
    
    def normalize_activity_label(self, raw_label: str) -> Dict[str, str]:
        """
        Normalise le label d'une activité
        
        Input: "On envoie un mail au client"
        Output: {
            "normalized_label": "Notifier Client",
            "verb": "notifier",
            "entity": "Client",
            "category": "Communication"
        }
        """
        raw_lower = raw_label.lower().strip()
        
        # Extraire verbe et entité
        verb, entity = self._extract_verb_entity(raw_lower)
        
        # Normaliser
        normalized_verb = self.VERB_NORMALIZATION.get(verb, verb)
        normalized_entity = self.ENTITY_NORMALIZATION.get(entity, entity.capitalize() if entity else "Activité")
        
        # Catégorie
        category = self._detect_category(normalized_verb, normalized_entity)
        
        return {
            "normalized_label": f"{normalized_verb.replace('_', ' ').title()} {normalized_entity}",
            "verb": normalized_verb,
            "entity": normalized_entity,
            "category": category,
            "original": raw_label
        }
    
    def _extract_verb_entity(self, text: str) -> Tuple[str, str]:
        """Extrait verbe et entité"""
        for pattern in self.ACTIVITY_PATTERNS:
            match = re.search(pattern, text)
            if match:
                groups = match.groupdict()
                verb = groups.get('verb', '')
                entity = groups.get('entity', '')
                if verb and entity:
                    return verb, entity
        
        words = text.split()
        verb = words[0] if words else ""
        entity = words[-1] if len(words) > 1 else ""
        return verb, entity
    
    def _detect_category(self, verb: str, entity: str) -> str:
        """Détecte la catégorie"""
        verb_categories = {
            "notifier": "Communication",
            "communiquer": "Communication",
            "contacter": "Communication",
            "approuver": "Validation",
            "contrôler": "Validation",
            "initialiser": "Création",
            "créer": "Création",
            "assembler": "Production",
            "traiter": "Traitement",
            "gérer": "Gestion",
            "persister": "Stockage",
            "archiver": "Stockage",
            "consulter": "Consultation",
            "mettre_à_jour": "Modification",
            "supprimer": "Suppression",
            "annuler": "Annulation",
            "calculer": "Calcul",
            "estimer": "Calcul",
            "rechercher": "Recherche",
            "décider": "Décision",
            "sélectionner": "Décision",
        }
        
        if verb in verb_categories:
            return verb_categories[verb]
        
        return "Général"
    
    def suggest_decomposition(self, activity_label: str) -> List[str]:
        """Suggère sous-activités"""
        normalized = self.normalize_activity_label(activity_label)
        entity = normalized["entity"]
        
        decomposition_templates = {
            "Commande": [
                "Recevoir la commande",
                "Vérifier la disponibilité",
                "Calculer le prix",
                "Confirmer au client"
            ],
            "Facture": [
                "Générer la facture",
                "Vérifier les montants",
                "Envoyer au client",
                "Suivre le paiement"
            ],
            "Réclamation": [
                "Recevoir la réclamation",
                "Analyser le problème",
                "Proposer une solution",
                "Clôturer le ticket"
            ],
            "Livraison": [
                "Préparer les articles",
                "Emballer le colis",
                "Planifier le transport",
                "Livrer au client"
            ]
        }
        
        return decomposition_templates.get(entity, [
            f"Initialiser {entity}",
            f"Traiter {entity}",
            f"Finaliser {entity}"
        ])
    
    def detect_implicit_flows(self, activities: List[str]) -> List[Dict[str, any]]:
        """Détecte flux implicites entre activités"""
        flows = []
        
        common_sequences = [
            ("Commande", "Facture", "PUIS"),
            ("Facture", "Paiement", "PUIS"),
            ("Commande", "Livraison", "PUIS"),
            ("Devis", "Commande", "SI_ALORS"),
            ("Stock", "Approvisionnement", "SI_ALORS"),
        ]
        
        for i, act1 in enumerate(activities):
            norm1 = self.normalize_activity_label(act1)
            
            for j, act2 in enumerate(activities):
                if i >= j:
                    continue
                
                norm2 = self.normalize_activity_label(act2)
                
                for entity1, entity2, flow_type in common_sequences:
                    if entity1 in norm1["entity"] and entity2 in norm2["entity"]:
                        flows.append({
                            "source": act1,
                            "target": act2,
                            "type": flow_type,
                            "confidence": 0.8
                        })
        
        return flows

