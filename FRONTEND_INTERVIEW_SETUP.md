# Frontend Interview Aide à la Décision - Setup

## ✅ Fichiers créés

### Structure complète
```
frontend/
├── lib/
│   ├── utils.ts                    ✅ Utilitaires (cn)
│   ├── api/
│   │   └── client.ts               ✅ Client API Axios
│   └── types/
│       └── ontology.ts             ✅ Types TypeScript (déjà existant)
├── components/
│   └── interview/
│       ├── timeline.tsx            ✅ Composant Timeline
│       └── guided-card.tsx         ✅ Composant GuidedCard
└── app/
    └── interview/
        ├── layout.tsx              ✅ Layout interview
        ├── page.tsx                ✅ Page d'accueil
        └── [id]/
            ├── decision/page.tsx   ✅ Écran 1: Décision
            ├── facts/page.tsx      ✅ Écran 2: Faits
            ├── origin/page.tsx     ✅ Écran 3: Origine
            ├── rules/page.tsx      ✅ Écran 4: Règles
            ├── signals/page.tsx     ✅ Écran 5: Signaux
            ├── pain-points/page.tsx ✅ Écran 6: Pain Points
            ├── synthesis/page.tsx  ✅ Écran 7: Synthèse
            └── submit/page.tsx     ✅ Écran 8: Soumission
```

## 📋 Dépendances à installer

### 1. React Hook Form + Zod
```bash
cd frontend
npm install react-hook-form @hookform/resolvers zod
```

### 2. Axios + TanStack Query
```bash
npm install axios @tanstack/react-query
```

### 3. shadcn/ui components manquants
```bash
npx shadcn-ui@latest add badge progress separator tabs
```

### 4. Utilitaires
```bash
npm install clsx tailwind-merge
```

### 5. Lucide React (icônes)
```bash
npm install lucide-react
```

## 🔧 Configuration requise

### 1. Fichier .env.local
Créer `frontend/.env.local` :
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 2. Vérifier les composants shadcn/ui
Assurez-vous que ces composants existent :
- `components/ui/button.tsx`
- `components/ui/card.tsx`
- `components/ui/form.tsx`
- `components/ui/input.tsx`
- `components/ui/label.tsx`
- `components/ui/select.tsx`
- `components/ui/textarea.tsx`

Si manquants, installer avec :
```bash
npx shadcn-ui@latest add [nom-du-composant]
```

## 🚀 Lancer l'application

### Backend (dans un terminal)
```bash
cd backend
uvicorn ava.main:app --reload
```

### Frontend (dans un autre terminal)
```bash
cd frontend
npm install  # Installer toutes les dépendances
npm run dev
```

### Ouvrir dans le navigateur
- Frontend : http://localhost:3000/interview
- Backend API : http://localhost:8000/docs

## 📝 Flow d'interview

1. **Page d'accueil** (`/interview`)
   - Description de l'atelier
   - Bouton "Démarrer l'atelier"
   - Crée une nouvelle interview via API

2. **Écran 1: Décision** (`/interview/[id]/decision`)
   - Formulaire : label + description
   - Validation Zod
   - Sauvegarde via API

3. **Écran 2: Faits** (`/interview/[id]/facts`)
   - Ajout/suppression de faits
   - Liste dynamique

4. **Écran 3: Origine** (`/interview/[id]/origin`)
   - Sélection source pour chaque fait
   - Types : system, calculation, manual, unknown

5. **Écran 4: Règles** (`/interview/[id]/rules`)
   - Ajout règles métier (if_then, while)
   - Condition + Conséquence

6. **Écran 5: Signaux** (`/interview/[id]/signals`)
   - Ajout signaux d'alerte
   - Sévérité + Contexte

7. **Écran 6: Pain Points** (`/interview/[id]/pain-points`)
   - Ajout problèmes identifiés
   - Type + Impact + Criticité

8. **Écran 7: Synthèse** (`/interview/[id]/synthesis`)
   - Récapitulatif complet
   - Lecture seule

9. **Écran 8: Soumission** (`/interview/[id]/submit`)
   - Validation finale
   - Soumission via API
   - Confirmation

## ✨ Fonctionnalités

- ✅ Timeline de progression (menu gauche)
- ✅ Navigation entre écrans
- ✅ Sauvegarde automatique à chaque étape
- ✅ Validation formulaires (Zod)
- ✅ États de chargement
- ✅ Gestion d'erreurs
- ✅ Interface responsive (shadcn/ui)

## 🔍 Points d'attention

1. **Composants shadcn/ui manquants**
   - Vérifier que tous les composants UI sont installés
   - Si erreur d'import, installer avec `npx shadcn-ui@latest add [nom]`

2. **Variables d'environnement**
   - `.env.local` doit contenir `NEXT_PUBLIC_API_URL`
   - Redémarrer le serveur Next.js après modification

3. **Backend**
   - Le backend doit être lancé sur http://localhost:8000
   - Vérifier la connexion avec `/health`

4. **Types TypeScript**
   - Les types sont dans `lib/types/ontology.ts`
   - Alignés avec les modèles Pydantic backend

## 🐛 Dépannage

### Erreur "Cannot find module '@/components/ui/...'"
```bash
npx shadcn-ui@latest add [nom-du-composant]
```

### Erreur "Cannot find module '@/lib/utils'"
Vérifier que `lib/utils.ts` existe et contient la fonction `cn`

### Erreur API
- Vérifier que le backend est lancé
- Vérifier `.env.local` avec `NEXT_PUBLIC_API_URL`
- Vérifier CORS dans le backend

### Erreur TypeScript
- Vérifier que `lib/types/ontology.ts` existe
- Vérifier les imports dans les pages

## ✅ Checklist de vérification

- [ ] Toutes les dépendances installées
- [ ] `.env.local` créé avec `NEXT_PUBLIC_API_URL`
- [ ] Composants shadcn/ui installés
- [ ] Backend lancé sur port 8000
- [ ] Frontend lancé sur port 3000
- [ ] Test du flow complet d'interview
- [ ] Vérification sauvegarde dans `backend/ava/data/interviews.json`

## 🎯 Prochaines étapes

Une fois le frontend validé :
- PROMPT 4 : Implémenter AVA Compiler (compilation en architecture)
- PROMPT 5 : Visualisation des résultats (React Flow)

