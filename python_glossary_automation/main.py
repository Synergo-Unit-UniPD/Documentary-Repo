import re
from sys import argv
from os.path import exists

if not exists(argv[1]):
    print("errore: path inserita non valida")
    exit()

with open(argv[1], "r", encoding="utf-8") as f:
    text = f.read()

glossario = []
with open("./glossary/glossary.txt", "r", encoding="utf-8") as f:
    for t in f.readlines():
        glossario.append(t.strip().lower().replace("\n", ""))

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

with open("./tex_example/termini.tex", "w", encoding="utf-8") as f:
    f.write(text)