'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { interviewApi } from '@/lib/api/client'
import type { Interview } from '@/lib/types/ontology'

const CACHE_KEY_PREFIX = 'interview_cache_'

function setCachedInterview(id: string, data: Interview) {
  if (typeof window === 'undefined') return
  
  try {
    const entry = {
      data,
      timestamp: Date.now()
    }
    localStorage.setItem(`${CACHE_KEY_PREFIX}${id}`, JSON.stringify(entry))
  } catch {
    // Ignorer les erreurs de localStorage
  }
}

export default function InterviewWelcomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleStart = async () => {
    setLoading(true)
    
    const interviewId = crypto.randomUUID()
    const newInterview: Interview = {
      id: interviewId,
      title: 'Interview Aide à la Décision',
      type: 'decision',
      context: {
        objective: 'Structurer la prise de décision',
        constraints: [],
        editable_by_interviewee: true,
      },
      decisions: [],
      processes: [],
      inventory: {
        actors: [],
        applications: [],
        data_objects: [],
        signals: [],
      },
      validation: {
        completeness_score: 0,
        validated_by_user: false,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Toujours créer l'interview localement dans le cache
    setCachedInterview(interviewId, newInterview)

    // Essayer de sauvegarder sur l'API, mais continuer même en cas d'erreur
    try {
      const response = await interviewApi.create(newInterview)
      // Si l'API retourne un ID différent, utiliser celui de l'API
      if (response.data.id !== interviewId) {
        // Mettre à jour le cache avec l'ID de l'API
        const updatedInterview = { ...newInterview, id: response.data.id }
        setCachedInterview(response.data.id, updatedInterview)
        router.push(`/interview/${response.data.id}/decision`)
      } else {
        router.push(`/interview/${interviewId}/decision`)
      }
    } catch (error) {
      // En cas d'erreur réseau, continuer avec l'interview locale
      console.warn('API non disponible, utilisation du mode local:', error)
      router.push(`/interview/${interviewId}/decision`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6">
      <div className="max-w-3xl w-full">
        <Card className="p-6">
          <h1 className="mb-4 text-3xl font-bold text-[#000]">
            Atelier de description métier
          </h1>
          
          <div className="space-y-6">
            <section>
              <h2 className="mb-2 text-lg font-semibold text-[#000]">
                🎯 Pourquoi cet atelier
              </h2>
              <p className="text-[#666]">
                Cet atelier a pour objectif de décrire de manière factuelle 
                comment les choses se passent aujourd'hui, afin de disposer 
                d'une base commune et fiable pour prendre de meilleures décisions.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold text-[#000]">
                🧭 Ce que nous allons faire ensemble
              </h2>
              <ol className="list-inside list-decimal space-y-1 text-[#666]">
                <li>Définir la décision à éclairer</li>
                <li>Identifier les faits nécessaires</li>
                <li>Décrire l'origine de ces faits</li>
                <li>Capturer les règles métier</li>
                <li>Définir les signaux d'alerte</li>
                <li>Identifier ce qui ne fonctionne pas</li>
                <li>Valider et soumettre</li>
              </ol>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold text-[#000]">
                ℹ️ Ce que l'on ne vous demandera pas
              </h2>
              <ul className="list-inside list-disc space-y-1 text-[#666]">
                <li>Concevoir une solution technique</li>
                <li>Proposer des améliorations</li>
                <li>Utiliser un vocabulaire technique</li>
              </ul>
              <p className="mt-2 text-sm text-[#666]">
                Vous décrivez la réalité telle qu'elle est vécue aujourd'hui.
              </p>
            </section>

            <Button
              onClick={handleStart}
              disabled={loading}
              size="lg"
              variant="primary"
              className="mt-8 w-full"
            >
              {loading ? 'Création...' : '▶️ Démarrer l\'atelier'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

