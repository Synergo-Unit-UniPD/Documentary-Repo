class ExporterError(Exception):
    """Eccezione base per il package export."""
    pass

class ConversionError(ExporterError):
    """Eccezione sollevata se convert_format fallisce."""
    pass