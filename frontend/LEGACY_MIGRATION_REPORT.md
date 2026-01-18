# Rapport de Migration Legacy → V3

## ✅ Dossiers renommés en _OLD

Tous les dossiers legacy ont été renommés pour éviter les conflits avec le nouveau code V3.

### 1. Routes Legacy
- ✅ `app/architect/` → `app/architect_OLD/`
  - Architecture visualization
  - Initiatives management
  - Mappings
  - Ask Aura
  
- ✅ `app/decision/` → `app/decision_OLD/`
  - Page de décision (ancien)
  
- ✅ `app/ops/` → `app/ops_OLD/`
  - Routes Ops (Ask, Initiatives, Signals)

### 2. Composants Legacy
- ✅ `app/components/` → `app/components_OLD/` (déjà fait précédemment)
  - CapabilityChip.tsx
  - ConversationalChat.tsx
  - EventCardEditable.tsx
  - InterviewChecklist.tsx
  - InterviewSummary.tsx

### 3. Hooks Legacy
- ✅ `app/hooks/` → `app/hooks_OLD/`
  - useCanonicalProcess.ts
  - useUnifiedInterview.ts

### 4. Types Legacy
- ✅ `app/types/` → `app/types_OLD/`
  - canonical.ts
  - interviewState.ts

### 5. Utilitaires Legacy
- ✅ `app/utils/` → `app/utils_OLD/`
  - antiLoopEngine.ts
  - llmReformulator.ts
  - questionEngine.ts
  - stateMachine.ts

## 📁 Structure finale

```
frontend/app/
├── interview/              ✅ NOUVEAU CODE V3
│   ├── [id]/
│   │   ├── decision/
│   │   ├── facts/
│   │   ├── origin/
│   │   ├── rules/
│   │   ├── signals/
│   │   ├── pain-points/
│   │   ├── synthesis/
│   │   └── submit/
│   ├── layout.tsx
│   └── page.tsx
│
├── architect_OLD/          ⚠️ LEGACY (backup)
├── components_OLD/          ⚠️ LEGACY (backup)
├── decision_OLD/           ⚠️ LEGACY (backup)
├── hooks_OLD/              ⚠️ LEGACY (backup)
├── ops_OLD/                ⚠️ LEGACY (backup)
├── types_OLD/              ⚠️ LEGACY (backup)
└── utils_OLD/              ⚠️ LEGACY (backup)
```

## ✅ Vérification des imports

### Code V3 (app/interview/)
✅ **Aucun import depuis le legacy**
- Tous les imports utilisent `@/lib/types/ontology` (nouveau modèle)
- Tous les imports utilisent `@/components/ui/` (nouveaux composants)
- Tous les imports utilisent `@/components/interview/` (nouveaux composants)

### Composants V3 (components/interview/)
✅ **Aucun import depuis le legacy**
- Utilise uniquement `@/lib/utils` (nouveau)

### Lib V3 (lib/)
✅ **Aucun import depuis le legacy**
- `lib/api/client.ts` utilise `@/lib/types/ontology` (nouveau)

## 📝 Documentation

Chaque dossier _OLD contient un README.md expliquant :
- Que c'est du code legacy
- Qu'il ne doit pas être utilisé
- Qu'il est conservé pour référence uniquement
- Ce qui l'a remplacé dans la V3

## ⚠️ Imports cassés (attendu)

Les imports dans le code legacy sont cassés (normal, c'est du legacy) :
- `app/architect_OLD/` peut importer depuis `app/types_OLD/` (cassé, mais c'est normal)
- `app/ops_OLD/` peut importer depuis `app/hooks_OLD/` (cassé, mais c'est normal)

**Ces imports cassés sont intentionnels** - le code legacy n'est pas utilisé et ne sera pas réparé.

## ✅ Résultat

- ✅ Tous les dossiers legacy renommés en _OLD
- ✅ Aucun import cassé dans le code V3
- ✅ Documentation complète dans chaque dossier _OLD
- ✅ Code V3 isolé et fonctionnel
- ✅ Legacy conservé pour référence

## 🎯 Prochaines étapes

Le code V3 est maintenant isolé et prêt pour le développement :
- `app/interview/` - Frontend Interview V3
- `components/interview/` - Composants Interview V3
- `lib/types/ontology.ts` - Modèle ontologique V3
- `lib/api/client.ts` - Client API V3

