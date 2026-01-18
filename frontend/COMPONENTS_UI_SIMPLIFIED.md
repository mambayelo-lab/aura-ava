# Composants UI Simplifiés

## ✅ Composants créés

Le dossier `components/ui/` contient **UNIQUEMENT** 3 composants simplifiés (comme demandé) :

### 1. `button.tsx`
- Composant Button avec styles Tailwind inline
- Supporte toutes les props HTML button standards
- Variants via className (pas de class-variance-authority)
- Export : `Button`

### 2. `card.tsx`
- Composant Card avec styles Tailwind inline
- Composant CardContent inclus
- Export : `Card`, `CardContent`

### 3. `input.tsx`
- Composant Input avec styles Tailwind inline
- Supporte toutes les props HTML input standards
- Export : `Input`

## 📁 Structure

```
frontend/
└── components/
    └── ui/
        ├── button.tsx    ✅
        ├── card.tsx      ✅
        └── input.tsx     ✅
```

## ✅ Vérifications

- ✅ Aucune erreur TypeScript
- ✅ Aucune erreur de linting
- ✅ Composants prêts à être utilisés
- ✅ Pas de dépendances complexes (pas de radix-ui, pas de class-variance-authority)

## 🔧 Utilisation

### Button
```typescript
import { Button } from '@/components/ui/button'

<Button onClick={handleClick}>Cliquer</Button>
<Button variant="outline" className="border-gray-300">Outline</Button>
```

### Card
```typescript
import { Card, CardContent } from '@/components/ui/card'

<Card>
  <CardContent>
    Contenu de la carte
  </CardContent>
</Card>
```

### Input
```typescript
import { Input } from '@/components/ui/input'

<Input type="text" placeholder="Saisir..." />
```

## ⚠️ Notes

- Les composants sont simplifiés et utilisent des classes Tailwind directes
- Pour ajouter des variants, utiliser la prop `className`
- **IMPORTANT** : Certains fichiers d'interview utilisent Form, Textarea, Select qui ne sont pas encore créés
- Ces composants devront être créés plus tard ou les imports devront être modifiés
- Si besoin de plus de composants, les créer de la même manière simplifiée

## ⚠️ Composants manquants utilisés dans le code

Les fichiers suivants utilisent des composants qui n'existent pas encore :
- `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` (utilisés dans `decision/page.tsx`)
- `Textarea` (utilisé dans `decision/page.tsx`, `rules/page.tsx`, `signals/page.tsx`, `pain-points/page.tsx`)
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` (utilisés dans `origin/page.tsx`, `rules/page.tsx`, `signals/page.tsx`, `pain-points/page.tsx`)

Ces composants devront être créés ou les imports devront être modifiés pour utiliser des alternatives.

