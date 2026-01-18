# 🔑 Configuration de la clé API Anthropic

## ⚠️ Erreur 401 - Clé API invalide

Si vous voyez l'erreur :
```
Erreur d'authentification : invalid x-api-key
```

Cela signifie que votre clé API Anthropic n'est pas configurée ou est invalide.

## 📝 Solution : Configurer la clé API

### Étape 1 : Obtenir une clé API

1. Allez sur https://console.anthropic.com/
2. Créez un compte ou connectez-vous
3. Allez dans "API Keys"
4. Créez une nouvelle clé API
5. Copiez la clé (elle commence par `sk-ant-api03-...`)

### Étape 2 : Configurer dans le projet

**Option A : Fichier .env (Recommandé)**

1. Ouvrez le fichier `backend/.env`
2. Ajoutez ou modifiez la ligne :
   ```env
   ANTHROPIC_API_KEY=sk-ant-api03-VOTRE-CLE-ICI
   ```
3. **IMPORTANT** : Ne mettez PAS de guillemets autour de la clé
4. **IMPORTANT** : Ne mettez PAS d'espaces avant ou après le `=`

Exemple correct :
```env
ANTHROPIC_API_KEY=sk-ant-api03-abc123def456...
```

Exemple incorrect :
```env
ANTHROPIC_API_KEY="sk-ant-api03-abc123def456..."  ❌ (guillemets)
ANTHROPIC_API_KEY = sk-ant-api03-abc123def456...  ❌ (espaces)
```

**Option B : Variable d'environnement système**

Sur Windows (PowerShell) :
```powershell
$env:ANTHROPIC_API_KEY="sk-ant-api03-VOTRE-CLE-ICI"
```

Sur Linux/Mac :
```bash
export ANTHROPIC_API_KEY="sk-ant-api03-VOTRE-CLE-ICI"
```

### Étape 3 : Redémarrer le serveur

Après avoir configuré la clé, **redémarrez le serveur backend** :

```bash
cd backend
uvicorn ava.main:app --reload --port 8000
```

## ✅ Vérification

Pour vérifier que la clé est bien chargée, le serveur devrait démarrer sans erreur et vous devriez pouvoir utiliser l'interview conversationnelle.

## 🐛 Dépannage

### Erreur : "ANTHROPIC_API_KEY environment variable not set"
- Vérifiez que le fichier `backend/.env` existe
- Vérifiez que la ligne `ANTHROPIC_API_KEY=...` est présente
- Redémarrez le serveur

### Erreur : "invalid x-api-key" ou "401"
- Vérifiez que la clé commence bien par `sk-ant-`
- Vérifiez qu'il n'y a pas de guillemets ou d'espaces
- Vérifiez que la clé n'est pas expirée sur https://console.anthropic.com/
- Vérifiez que vous avez des crédits disponibles

### Erreur : "format invalide"
- La clé doit commencer par `sk-ant-`
- Si votre clé commence par autre chose, elle est invalide
- Obtenez une nouvelle clé sur https://console.anthropic.com/

## 📚 Documentation

- Anthropic Console : https://console.anthropic.com/
- Documentation API : https://docs.anthropic.com/

