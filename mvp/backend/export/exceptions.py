class ExportError(Exception):
    """Eccezione base per il package export."""

    def __new__(cls, *args, **kwargs):
        if cls is ExportError:
            raise TypeError("ExportError è astratta: istanzia una sottoclasse concreta (es. ConversionError).")
        return super().__new__(cls)

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class ConversionError(ExportError):
    """Eccezione sollevata se convert_format fallisce."""

    pass
