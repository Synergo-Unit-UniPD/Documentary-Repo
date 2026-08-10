from dataclasses import dataclass, field

@dataclass(frozen=True)
class Content:
    """
    «valueObject» che rappresenta il contenuto parsato della nota. 
    """
    nodes: list = field(default_factory=list)