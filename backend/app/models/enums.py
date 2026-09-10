"""Canonical enumeration types for PolarOps domain models.

All enum values are strict, upper-cased strings enforcing domain integrity
and preventing arbitrary string drift in telemetry, provenance, and status.
"""

from enum import StrEnum


class TruthType(StrEnum):
    """Data provenance classification."""

    MEASURED = "MEASURED"
    DERIVED = "DERIVED"
    FORECAST = "FORECAST"
    SCENARIO = "SCENARIO"
    SYNTHETIC_SIMULATION = "SYNTHETIC_SIMULATION"


class OperationalEventType(StrEnum):
    """Operational event categorization."""

    TELEMETRY_CHANGE = "TELEMETRY_CHANGE"
    THRESHOLD_BREACH = "THRESHOLD_BREACH"
    ASSET_STATUS_CHANGE = "ASSET_STATUS_CHANGE"
    RISK_CHANGE = "RISK_CHANGE"
    DEPENDENCY_EXPOSURE = "DEPENDENCY_EXPOSURE"
    MAINTENANCE_BLOCKED = "MAINTENANCE_BLOCKED"
    INVENTORY_SHORTAGE = "INVENTORY_SHORTAGE"
    RESUPPLY_CHANGE = "RESUPPLY_CHANGE"
    ENERGY_CHANGE = "ENERGY_CHANGE"
    WEATHER_CHANGE = "WEATHER_CHANGE"
    COMMUNICATION_STATE = "COMMUNICATION_STATE"
    SYNC_QUEUE_EVENT = "SYNC_QUEUE_EVENT"
    SCIENCE_BUFFER_EVENT = "SCIENCE_BUFFER_EVENT"
    INCIDENT_CREATED = "INCIDENT_CREATED"
    INCIDENT_STATUS_CHANGE = "INCIDENT_STATUS_CHANGE"
    DECISION_RECORDED = "DECISION_RECORDED"
    ACTION_RECORDED = "ACTION_RECORDED"
    MEMORY_RECORDED = "MEMORY_RECORDED"
    SCENARIO_EVALUATED = "SCENARIO_EVALUATED"
    CROSS_STATION_ANALYSIS = "CROSS_STATION_ANALYSIS"


class Quality(StrEnum):
    """Telemetry data quality assessment."""

    GOOD = "GOOD"
    SUSPECT = "SUSPECT"
    BAD = "BAD"


class StationStatus(StrEnum):
    """Operational readiness state of a research station."""

    NOMINAL = "NOMINAL"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"
    MAINTENANCE = "MAINTENANCE"


class EnvironmentMode(StrEnum):
    """Antarctic seasonal operating mode."""

    SUMMER = "SUMMER"
    WINTER = "WINTER"


class AssetCategory(StrEnum):
    """Broad classification of station equipment."""

    GENERATOR = "GENERATOR"
    BOILER = "BOILER"
    WATER_MAKER = "WATER_MAKER"
    COMM_DOME = "COMM_DOME"
    HVAC = "HVAC"
    PUMP = "PUMP"
    POWER_DISTRIBUTION = "POWER_DISTRIBUTION"


class AssetStatus(StrEnum):
    """Asset operational health status."""

    NOMINAL = "NOMINAL"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"
    SHUTDOWN = "SHUTDOWN"
    MAINTENANCE = "MAINTENANCE"


class Criticality(StrEnum):
    """System and service criticality level."""

    LIFE_SUPPORT = "LIFE_SUPPORT"
    CRITICAL = "CRITICAL"
    STANDARD = "STANDARD"
    DEFERRABLE = "DEFERRABLE"


class DependencyType(StrEnum):
    """Nature of upstream/downstream connection between entities."""

    ELECTRICAL = "ELECTRICAL"
    THERMAL = "THERMAL"
    FUEL = "FUEL"
    DATA = "DATA"
    PHYSICAL = "PHYSICAL"


class MaintenancePriority(StrEnum):
    """Work order urgency."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    EMERGENCY = "EMERGENCY"


class MaintenanceStatus(StrEnum):
    """Work order lifecycle state."""

    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    BLOCKED_PARTS = "BLOCKED_PARTS"


class ResupplyStatus(StrEnum):
    """Vessel resupply opportunity tracking."""

    SCHEDULED = "SCHEDULED"
    IN_TRANSIT = "IN_TRANSIT"
    DELAYED = "DELAYED"
    DELIVERED = "DELIVERED"


class CommsLinkStatus(StrEnum):
    """Satellite communication link state machine."""

    ONLINE = "ONLINE"
    DEGRADED = "DEGRADED"
    OFFLINE = "OFFLINE"
    RESTORING = "RESTORING"
    SYNCING = "SYNCING"


class SyncStatus(StrEnum):
    """Local offline sync queue item lifecycle."""

    PENDING = "PENDING"
    TRANSFERRING = "TRANSFERRING"
    VERIFIED = "VERIFIED"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RECONCILED = "RECONCILED"
    FAILED_RETRY = "FAILED_RETRY"
    # Legacy alias
    QUEUED = "PENDING"


class IncidentSeverity(StrEnum):
    """Operational incident severity rating."""

    MINOR = "MINOR"
    MAJOR = "MAJOR"
    CRITICAL = "CRITICAL"


class IncidentStatus(StrEnum):
    """Incident resolution lifecycle."""

    ACTIVE = "ACTIVE"
    CONTAINED = "CONTAINED"
    RESOLVED = "RESOLVED"


class LifecycleStatus(StrEnum):
    """Operational lifecycle state for model/schema/configuration versions.

    ACTIVE     — Currently valid for operational use and version selection.
    DEPRECATED — Historically valid and traceable, but should not be selected
                 as the preferred current version for new operations.
    RETIRED    — No longer operationally valid.  Must remain available for
                 historical provenance; must never be deleted.
    """

    ACTIVE = "ACTIVE"
    DEPRECATED = "DEPRECATED"
    RETIRED = "RETIRED"
