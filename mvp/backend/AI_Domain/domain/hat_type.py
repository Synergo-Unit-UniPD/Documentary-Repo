from enum import Enum


class HatType(str, Enum):
    WHITE = "white"    # fatti e dati oggettivi
    RED = "red"         # emozioni e intuizioni
    BLACK = "black"      # criticità e rischi
    YELLOW = "yellow"     # benefici e ottimismo
    GREEN = "green"       # creatività e alternative
    BLUE = "blue"        # visione d'insieme e processo
