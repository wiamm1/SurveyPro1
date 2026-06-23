import os
import sys

# Ajouter le répertoire parent au path pour pouvoir importer 'app'
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import SurveyTemplate
import json

def seed_templates():
    db = SessionLocal()
    try:
        # Template 1: Satisfaction Client
        template1 = SurveyTemplate(
            name="satisfaction_client_standard",
            title="Satisfaction Client (NPS)",
            description="Modèle standard pour évaluer la satisfaction globale et le Net Promoter Score (NPS).",
            structure={
                "sections": [
                    {
                        "title": "Évaluation globale",
                        "description": "Vos retours nous aident à nous améliorer.",
                        "order_index": 0,
                        "questions": [
                            {
                                "text": "Dans quelle mesure êtes-vous satisfait de notre service ?",
                                "type": "scale",
                                "is_required": True,
                                "order_index": 0,
                                "settings": {"min": 1, "max": 5, "label": "Niveau de satisfaction"},
                                "options": []
                            },
                            {
                                "text": "Quelle est la probabilité que vous recommandiez notre entreprise à un ami ou un collègue ?",
                                "type": "scale",
                                "is_required": True,
                                "order_index": 1,
                                "settings": {"min": 0, "max": 10, "label": "NPS"},
                                "options": []
                            }
                        ]
                    },
                    {
                        "title": "Commentaires",
                        "description": "Exprimez-vous librement.",
                        "order_index": 1,
                        "questions": [
                            {
                                "text": "Qu'avez-vous le plus apprécié ?",
                                "type": "text",
                                "is_required": False,
                                "order_index": 0,
                                "settings": {},
                                "options": []
                            },
                            {
                                "text": "Que pourrions-nous améliorer ?",
                                "type": "text",
                                "is_required": False,
                                "order_index": 1,
                                "settings": {},
                                "options": []
                            }
                        ]
                    }
                ]
            },
            is_active=True
        )

        # Template 2: Feedback Événement
        template2 = SurveyTemplate(
            name="feedback_evenement",
            title="Feedback Post-Événement",
            description="Recueillez les impressions des participants après un webinaire ou un événement physique.",
            structure={
                "sections": [
                    {
                        "title": "Organisation et Logistique",
                        "description": "",
                        "order_index": 0,
                        "questions": [
                            {
                                "text": "Comment évaluez-vous l'organisation générale de l'événement ?",
                                "type": "single_choice",
                                "is_required": True,
                                "order_index": 0,
                                "settings": {},
                                "options": [
                                    {"text": "Très satisfait", "order_index": 0},
                                    {"text": "Satisfait", "order_index": 1},
                                    {"text": "Neutre", "order_index": 2},
                                    {"text": "Insatisfait", "order_index": 3}
                                ]
                            }
                        ]
                    },
                    {
                        "title": "Contenu",
                        "description": "",
                        "order_index": 1,
                        "questions": [
                            {
                                "text": "Les sujets abordés répondaient-ils à vos attentes ?",
                                "type": "single_choice",
                                "is_required": True,
                                "order_index": 0,
                                "settings": {},
                                "options": [
                                    {"text": "Oui tout à fait", "order_index": 0},
                                    {"text": "Partiellement", "order_index": 1},
                                    {"text": "Non pas du tout", "order_index": 2}
                                ]
                            }
                        ]
                    }
                ]
            },
            is_active=True
        )

        existing_templates = {t.name: t for t in db.query(SurveyTemplate).all()}
        
        added = 0
        updated = 0

        if template1.name in existing_templates:
            existing = existing_templates[template1.name]
            existing.structure = template1.structure
            existing.title = template1.title
            existing.description = template1.description
            updated += 1
        else:
            db.add(template1)
            added += 1

        if template2.name in existing_templates:
            existing = existing_templates[template2.name]
            existing.structure = template2.structure
            existing.title = template2.title
            existing.description = template2.description
            updated += 1
        else:
            db.add(template2)
            added += 1

        db.commit()
        print(f"{added} templates ajoutés, {updated} mis à jour avec succès.")
    except Exception as e:
        db.rollback()
        print(f"Erreur lors de l'ajout des templates: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_templates()
