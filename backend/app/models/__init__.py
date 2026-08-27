"""
SQLAlchemy model registry — import all models here so Base.metadata knows about them.
"""
from app.db.base import Base  # noqa: F401

# Core user / auth
from app.models.user import (  # noqa: F401
    UserModel,
    SessionModel,
    PasswordResetTokenModel,
    ChwModel,
    PlatformUserModel,
)

# RBAC
from app.models.rbac import RoleModel, PermissionModel, UserRoleModel, roles_permissions  # noqa: F401

# Organization hierarchy
from app.models.org import OrganizationModel, RegionModel, DistrictModel, TeamModel  # noqa: F401

# Clinical
from app.models.patient import (  # noqa: F401
    PatientModel,
    PatientAssignmentModel,
    PatientContactModel,
    PatientStatusHistoryModel,
)
from app.models.assessment import (  # noqa: F401
    AssessmentTemplateModel,
    AssessmentTemplateVersionModel,
    AssessmentSectionModel,
    AssessmentQuestionModel,
    AssessmentOptionModel,
    AssessmentModel,
    AssessmentAnswerModel,
    AssessmentResultModel,
)
from app.models.clinical import (  # noqa: F401
    ReferralModel,
    FollowUpModel,
    RiskResultModel,
    RiskFlagModel,
    CaseRecordModel,
)
from app.models.case import (  # noqa: F401
    CaseModel,
    CaseNoteModel,
    CaseReviewModel,
    CaseEscalationModel,
    CaseStatusHistoryModel,
)

# System / Admin / Training
from app.models.admin import (  # noqa: F401
    OrgUnitModel,
    AuditEventModel,
    SystemServiceModel,
    RoleDefinitionModel,
    ProgramMetricModel,
    SystemSettingModel,
)
from app.models.messaging import DirectMessageModel  # noqa: F401
from app.models.training import TrainingLessonModel  # noqa: F401

# Notifications & Audit
from app.models.notification import NotificationModel, UserNotificationModel  # noqa: F401
from app.models.audit import AuditLogModel  # noqa: F401
