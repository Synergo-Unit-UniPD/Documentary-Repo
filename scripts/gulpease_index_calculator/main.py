import os
import re
from pypdf import PdfReader
from sys import argv

# Manteniamo il file di testo, ma ora funzionerà come un .gitignore
excluded_items = []
if os.path.exists("./files_to_exclude.txt"):
    with open("./files_to_exclude.txt", "r", encoding="utf-8") as f:
        for line in f:
            # Sostituiamo i backslash con gli slash per uniformità di controllo
            item_pulito = line.strip().lower().replace('\\', '/')
            if item_pulito:  
                excluded_items.append(item_pulito)
print("Regole di esclusione caricate:", excluded_items)


def calcola_gulpease(lettere, parole, frasi):
    """Applica la formula di Gulpease basandosi sui contatori grezzi."""
    if parole == 0:
        return 0
    indice = 89 + (300 * frasi - 10 * lettere) / parole
    return round(indice, 2)


def analizza_testo_grezzo(testo):
    """Estrae i dati grezzi dal testo di un singolo PDF."""
    lettere = sum(1 for c in testo if c.isalpha())
    parole_lista = re.findall(r'[a-zA-ZàèìòùáéíóúòçÀÈÌÒÙÁÉÍÓÚÚ]+', testo)
    parole = len(parole_lista)
    
    testo_pulito = re.sub(r'\.{2,}', ' ', testo)
    testo_pulito = re.sub(r'\d+\.\d+', '', testo_pulito)
    frasi_lista = re.split(r'[.!?]+(?:\s|$)', testo_pulito)
    frasi = len([f for f in frasi_lista if f.strip()])
    
    if frasi == 0 and parole > 0:
        frasi = 1
        
    return lettere, parole, frasi


def analizza_cartella_pdf(percorso_cartella):
    """Scansiona le cartelle e applica le esclusioni sul percorso completo."""
    repo_lettere = 0
    repo_parole = 0
    repo_frasi = 0
    file_analizzati = 0

    print(f"\n{'File PDF':<40} | {'Gulpease':<8} | {'Parole':<7}")
    print("-" * 60)
    
    for root, dirs, files in os.walk(percorso_cartella):
        for file in files:
            if file.lower().endswith('.pdf'):
                percorso_completo = os.path.join(root, file)
                # Normalizziamo il percorso per il controllo
                percorso_norm = percorso_completo.lower().replace('\\', '/')
                
                # --- NOVITÀ: Controllo intelligente delle esclusioni ---
                da_escludere = False
                for regola in excluded_items:
                    # Se la regola è contenuta nel percorso del file, ignoralo!
                    if regola in percorso_norm:
                        da_escludere = True
                        break
                
                if not da_escludere:
                    try:
                        reader = PdfReader(percorso_completo)
                        testo_completo = ""
                        for pagina in reader.pages:
                            testo_estratto = pagina.extract_text()
                            if testo_estratto:
                                testo_completo += " " + testo_estratto
                        
                        lettere, parole, frasi = analizza_testo_grezzo(testo_completo)
                        
                        if parole > 0:
                            repo_lettere += lettere
                            repo_parole += parole
                            repo_frasi += frasi
                            file_analizzati += 1
                            
                            indice_singolo = calcola_gulpease(lettere, parole, frasi)
                            nome_file_corto = file if len(file) <= 40 else file[:37] + "..."
                            print(f"{nome_file_corto:<40} | {indice_singolo:<8} | {parole:<7}")
                        
                    except Exception as e:
                        print(f"Errore nella lettura del file {file}: {e}")

    # --- STAMPA DEL VERDETTO FINALE ---
    print("\n" + "=" * 60)
    print(f" RISULTATO GLOBALE DELLA REPOSITORY ({file_analizzati} file analizzati)")
    print("=" * 60)
    
    if repo_parole > 0:
        gulpease_globale = calcola_gulpease(repo_lettere, repo_parole, repo_frasi)
        print(f"Totale Lettere: {repo_lettere} | Totale Parole: {repo_parole} | Totale Frasi: {repo_frasi}")
        print(f"--> INDICE DI GULPEASE GLOBALE: {gulpease_globale}")
        # (I print dei target rimangono uguali...)
        if gulpease_globale < 40:
            print("Target: Molto difficile (Comprensibile a livello universitario).")
        elif gulpease_globale < 60:
            print("Target: Media difficoltà (Comprensibile con diploma superiore).")
        elif gulpease_globale < 80:
            print("Target: Facile (Comprensibile con licenza media).")
        else:
            print("Target: Semplicissimo (Comprensibile con licenza elementare).")
    else:
        print("Nessun testo valido estratto dai PDF trovati.")


if len(argv) < 2:
    print("Errore: Devi passare il percorso della cartella come argomento da terminale!")
    exit(1)

cartella_documenti = argv[1]

if __name__ == "__main__":
    if not os.path.exists(cartella_documenti):
        print(f"Il percorso fornito '{cartella_documenti}' non esiste. Verifica l'argomento passato.")
    else:
        analizza_cartella_pdf(cartella_documenti)