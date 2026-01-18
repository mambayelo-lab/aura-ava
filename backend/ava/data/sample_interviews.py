"""
Datasets test pour démonstration
3 secteurs : Retail, Énergie, Logistique
"""

SAMPLE_INTERVIEWS = {
    "retail_order_process": {
        "perimeter": "Processus de commande client e-commerce",
        "objective": "Réduire le temps de traitement de 48h à 24h",
        "mode": "transformation",
        "initial_description": """
        Le client passe commande sur le site web. Le système enregistre la commande dans Salesforce.
        L'équipe logistique vérifie la disponibilité des produits dans le WMS.
        Si les produits sont disponibles, on prépare la commande.
        Le transporteur récupère le colis et livre au client.
        Le client reçoit un email de confirmation à chaque étape.
        """,
        "expected_activities": [
            "Passer commande en ligne",
            "Enregistrer commande",
            "Vérifier disponibilité stock",
            "Préparer commande",
            "Livrer commande",
            "Notifier client"
        ],
        "expected_objects": [
            {
                "name": "Commande",
                "attributes": ["numéro", "date", "client", "produits", "montant", "statut"],
                "source_system": "Salesforce"
            },
            {
                "name": "Stock",
                "attributes": ["produit", "quantité disponible", "entrepôt"],
                "source_system": "WMS"
            }
        ],
        "expected_actors": [
            {"name": "Client", "type": "personne"},
            {"name": "Système e-commerce", "type": "systeme"},
            {"name": "Équipe logistique", "type": "equipe"},
            {"name": "Transporteur", "type": "personne"}
        ],
        "expected_rules": [
            {
                "condition": "montant > 100€",
                "action": "livraison gratuite",
                "type": "SI_ALORS"
            },
            {
                "condition": "stock insuffisant",
                "action": "notification client retard",
                "type": "SI_ALORS"
            }
        ],
        "expected_signals": [
            {
                "event": "Retard livraison > 24h",
                "action": "Alerter service client",
                "severity": "HIGH",
                "threshold": "24h"
            }
        ]
    },
    
    "energy_billing_process": {
        "perimeter": "Processus de facturation clients énergie",
        "objective": "Automatiser 80% de la facturation",
        "mode": "transformation",
        "initial_description": """
        Chaque mois, le système Kaluza récupère les données de consommation depuis les compteurs intelligents.
        Le système calcule le montant à facturer en appliquant les tarifs en vigueur.
        Pour les gros consommateurs (> 10000 kWh/mois), une validation manager est nécessaire.
        Le système SAP génère la facture et l'envoie par email au client.
        Si le paiement n'est pas reçu dans 30 jours, un rappel automatique est envoyé.
        En cas de non-paiement après 60 jours, le dossier est transmis au service recouvrement.
        """,
        "expected_activities": [
            "Récupérer données consommation",
            "Calculer montant facture",
            "Valider facture gros consommateur",
            "Générer facture",
            "Envoyer facture client",
            "Gérer rappels paiement",
            "Transmettre au recouvrement"
        ],
        "expected_objects": [
            {
                "name": "Consommation",
                "attributes": ["période", "kWh consommés", "compteur", "client"],
                "source_system": "Kaluza"
            },
            {
                "name": "Facture",
                "attributes": ["numéro", "montant", "date", "échéance", "statut paiement"],
                "source_system": "SAP"
            }
        ],
        "expected_actors": [
            {"name": "Système Kaluza", "type": "systeme"},
            {"name": "Système SAP", "type": "systeme"},
            {"name": "Manager facturation", "type": "personne"},
            {"name": "Service recouvrement", "type": "equipe"}
        ],
        "expected_rules": [
            {
                "condition": "consommation > 10000 kWh/mois",
                "action": "validation manager requise",
                "type": "SI_ALORS"
            },
            {
                "condition": "retard paiement > 30 jours",
                "action": "envoyer rappel automatique",
                "type": "SI_ALORS"
            },
            {
                "condition": "retard paiement > 60 jours",
                "action": "transmission au recouvrement",
                "type": "SI_ALORS"
            }
        ],
        "expected_signals": [
            {
                "event": "Pic de consommation anormal",
                "action": "Vérifier compteur",
                "severity": "MEDIUM",
                "threshold": "+50% vs moyenne"
            }
        ]
    },
    
    "logistics_warehouse_receiving": {
        "perimeter": "Processus de réception marchandises entrepôt",
        "objective": "Réduire erreurs de réception de 15% à 2%",
        "mode": "transformation",
        "initial_description": """
        Le transporteur arrive avec la marchandise et présente le bon de livraison.
        L'opérateur scanne le code-barres du bon de livraison dans le WMS.
        L'opérateur vérifie physiquement la marchandise (quantité et état).
        S'il y a des écarts ou des dommages, on crée une réclamation dans le système.
        Si tout est conforme, on valide la réception dans le WMS.
        Le système met à jour automatiquement les stocks disponibles.
        Une notification est envoyée au service achats pour confirmer la réception.
        Les produits sont ensuite rangés dans les emplacements de stockage.
        """,
        "expected_activities": [
            "Arriver avec marchandise",
            "Scanner bon de livraison",
            "Vérifier marchandise physiquement",
            "Créer réclamation si écart",
            "Valider réception",
            "Mettre à jour stocks",
            "Notifier service achats",
            "Ranger produits"
        ],
        "expected_objects": [
            {
                "name": "Bon de livraison",
                "attributes": ["numéro", "fournisseur", "produits", "quantités"],
                "source_system": "WMS"
            },
            {
                "name": "Réception",
                "attributes": ["date", "quantité reçue", "statut", "écarts"],
                "source_system": "WMS"
            },
            {
                "name": "Stock",
                "attributes": ["produit", "quantité", "emplacement"],
                "source_system": "WMS"
            },
            {
                "name": "Réclamation",
                "attributes": ["type", "description", "photos", "statut"],
                "source_system": "WMS"
            }
        ],
        "expected_actors": [
            {"name": "Transporteur", "type": "personne"},
            {"name": "Opérateur logistique", "type": "personne"},
            {"name": "Système WMS", "type": "systeme"},
            {"name": "Service achats", "type": "equipe"}
        ],
        "expected_rules": [
            {
                "condition": "écart quantité > 5%",
                "action": "créer réclamation obligatoire",
                "type": "SI_ALORS"
            },
            {
                "condition": "produit endommagé",
                "action": "bloquer mise en stock + photo obligatoire",
                "type": "SI_ALORS"
            }
        ],
        "expected_signals": [
            {
                "event": "Réclamations > 3 pour même fournisseur en 1 mois",
                "action": "Alerter responsable achats",
                "severity": "HIGH",
                "threshold": "3 réclamations/mois"
            }
        ],
        "expected_pain_points": [
            {
                "description": "Erreurs de comptage manuel",
                "impact": "erreurs",
                "severity": "HIGH"
            },
            {
                "description": "Temps perdu à chercher emplacements de stockage",
                "impact": "temps_perdu",
                "severity": "MEDIUM"
            }
        ]
    }
}

