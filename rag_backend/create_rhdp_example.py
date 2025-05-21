from forces_store import create_party

if __name__ == "__main__":
    party = create_party(
        nom="RHDP",
        description="Le Rassemblement des Houphouëtistes pour la Démocratie et la Paix (RHDP) est un parti politique majeur en Côte d'Ivoire, fondé autour de l'héritage d'Houphouët-Boigny.",
        logo_url="https://upload.wikimedia.org/wikipedia/commons/2/2c/Logo_RHDP.png"
    )
    print(f"Fiche RHDP créée : {party}")
