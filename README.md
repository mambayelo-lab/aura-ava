# AURA AVA V3

## Configuration rapide

### 1. Clé API Anthropic (requis pour l'interview conversationnelle)

**Méthode rapide** :
```powershell
.\setup-api-key.ps1
```

Le script vous guidera pour configurer votre clé API. Obtenez votre clé sur https://console.anthropic.com/

**Méthode manuelle** :
1. Créez/modifiez `backend/.env`
2. Ajoutez : `ANTHROPIC_API_KEY=votre-cle-ici`
3. Redémarrez le serveur backend

Voir `backend/CONFIGURE_API_KEY.md` pour plus de détails.

### 2. Démarrage

**Backend** :
```bash
cd backend
uvicorn ava.main:app --reload --port 8000
```

**Frontend** :
```bash
cd frontend
npm run dev
```

## Documentation

- Configuration API : `backend/CONFIGURE_API_KEY.md`
- Architecture : Voir les fichiers dans `backend/ava/`

---