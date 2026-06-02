import re
from sys import argv
from os.path import exists

text = ""

# leggo tutti i file in ordine
for i in range(1, len(argv)):
    if not exists(argv[i]):
        print(f"errore: {i} path inserita non valida")
        exit()

    with open(argv[i], "r", encoding="utf-8") as f:
        text += f.read() + "%%%%%SEPARATORE%%%%%"

# leggo le parole del glossario
glossario = []
with open("./glossary/glossary.txt", "r", encoding="utf-8") as f:
    for t in f.readlines():
        glossario.append(t.strip().lower().replace("\n", ""))

# per ogni parola, sostituisco la prima occorrenza in tutti i testi
for parola in glossario:
    pattern = r'\b' + re.escape(parola) + r'\b'

    def sostituisci(match):
        return match.group(0) + r"\textsubscript{G}"

    text = re.sub(
        pattern,
        sostituisci,
        text,
        count=1,
        flags=re.IGNORECASE
    )

# separo i testi e riscrivo su file originale
separated = text.split("%%%%%SEPARATORE%%%%%")
for i in range(1, len(argv)):
    with open(argv[i], "w", encoding="utf-8") as f:
        f.write(separated[i-1])