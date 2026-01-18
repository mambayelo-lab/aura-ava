# Modifications à appliquer sur l'interview conversationnelle

## Backend (✅ Fait)
- ✅ Route `/finish` pour terminer l'interview
- ✅ Route `/notes` pour mettre à jour les notes aux architectes
- ✅ Reformulation des messages utilisateur (méthode `reformulate_user_message`)
- ✅ LLM plus verrouillé (ne reformule que si nécessaire)
- ✅ Modèle mis à jour avec `notes_to_architects`

## Frontend (À faire)

### 1. Structure de la page
- Bandeau gauche (280px) : Restitution complète et modifiable
- Centre : Conversation
- Bandeau droit (280px) : Reconstitution modifiable (au lieu d'être dans la conversation)

### 2. Bandeau gauche - Restitution
- Tous les concepts modifiables avec bouton crayon (Edit2)
- Possibilité d'ajouter des éléments (bouton +)
- Afficher :
  - Activités (avec déclencheurs, sous-activités)
  - Objets métier
  - Acteurs
  - Règles métier (SI_ALORS, TANT_QUE)
  - Signaux / Alertes (avec seuils)
  - Points de friction
- Bouton "Visualiser la restitution globale" en bas

### 3. Bandeau droit - Reconstitution
- Déplacer le bloc de reconstitution modifiable ici
- Style similaire au bandeau gauche

### 4. Conversation
- Ne pas dupliquer le message utilisateur
- Toutes les réponses de l'agent doivent être validables (bouton "Valider" ou "Continuer")
- Supprimer la section "Données extraites - À valider" (validation automatique)

### 5. Boutons et actions
- Bouton "Terminer l'interview" (appelle `/finish`)
- Section "Note à transmettre aux architectes" avec Textarea
- Corriger le bouton "Compiler" pour qu'il redirige vers la page de résultat
- Bouton "Visualiser la restitution globale" sur le bandeau gauche

### 6. Notes aux architectes
- Ajouter une section en bas du bandeau gauche ou dans la phase consolidation
- Textarea libre pour les notes
- Sauvegarde automatique

