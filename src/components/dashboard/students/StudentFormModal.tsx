import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  GraduationCap,
  Users,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Building,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { Student } from '../../../types';
import { studentService } from '../../../services/studentService';
import { adminBackendService } from '../../../services/adminBackendService';
import { DateInput } from '../../common/DateInput';
import { parseDateParts, formatDateToISO } from '../../../utils/dateUtils';

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (student: Student, isEdit: boolean) => void;
  initialData?: Partial<Student> | Student | null;
  isEditMode?: boolean;
}

const CLASS_OPTIONS = [
  'Nursery',
  'LKG',
  'UKG',
  'Class 1',
  'Class 2',
  'Class 3',
  'Class 4',
  'Class 5',
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
];

const SECTION_OPTIONS = ['A', 'B', 'C', 'D'];
const ACADEMIC_YEARS = ['2026-2027', '2025-2026', '2024-2025'];
const RELATIONSHIP_OPTIONS = ['Father', 'Mother', 'Guardian', 'Grandparent', 'Other'];

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  isEditMode,
}) => {
  // Determine if this is editing an existing student vs creating/enrolling new
  const isEdit =
    isEditMode !== undefined
      ? isEditMode
      : Boolean(initialData && (initialData.id || (initialData as any).studentId));

  const [formData, setFormData] = useState({
    admissionNumber: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'Male',
    className: 'Class 1',
    section: 'A',
    rollNumber: '',
    academicYear: '2026-2027',
    admissionDate: new Date().toISOString().split('T')[0],
    guardianName: '',
    guardianRelationship: 'Father',
    guardianPhone: '',
    guardianEmail: '',
    address: '',
    previousSchool: '',
    active: true,
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          admissionNumber: initialData.admissionNumber || '',
          firstName: initialData.firstName || '',
          lastName: initialData.lastName || '',
          dateOfBirth: initialData.dateOfBirth || '',
          gender: initialData.gender || 'Male',
          className: initialData.className || 'Class 1',
          section: initialData.section || 'A',
          rollNumber: initialData.rollNumber || '',
          academicYear: initialData.academicYear || '2026-2027',
          admissionDate: initialData.admissionDate || new Date().toISOString().split('T')[0],
          guardianName: initialData.guardianName || '',
          guardianRelationship: initialData.guardianRelationship || 'Father',
          guardianPhone: initialData.guardianPhone || '',
          guardianEmail: initialData.guardianEmail || '',
          address: initialData.address || '',
          previousSchool: initialData.previousSchool || '',
          active: initialData.active !== undefined ? initialData.active : true,
        });
      } else {
        setFormData({
          admissionNumber: '',
          firstName: '',
          lastName: '',
          dateOfBirth: '',
          gender: 'Male',
          className: 'Class 1',
          section: 'A',
          rollNumber: '',
          academicYear: '2026-2027',
          admissionDate: new Date().toISOString().split('T')[0],
          guardianName: '',
          guardianRelationship: 'Father',
          guardianPhone: '',
          guardianEmail: '',
          address: '',
          previousSchool: '',
          active: true,
        });
      }
      setError(null);
      setFieldErrors({});
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const displayStudentId = isEdit
    ? (initialData?.studentId || initialData?.admissionNumber || initialData?.id || 'Existing Student')
    : null;

  const validateForm = () => {
    const errors: Record<string, string> = {};

    const adm = (formData.admissionNumber || '').trim();
    if (!adm) {
      errors.admissionNumber = 'Admission Number is required.';
    }

    const fn = (formData.firstName || '').trim();
    if (!fn) {
      errors.firstName = 'First Name is required.';
    }

    const ln = (formData.lastName || '').trim();
    if (!ln) {
      errors.lastName = 'Last Name is required.';
    }

    const dob = (formData.dateOfBirth || '').trim();
    if (!dob) {
      errors.dateOfBirth = 'Date of Birth is required.';
    } else {
      const parts = parseDateParts(dob);
      if (!parts || !parts.isValid) {
        errors.dateOfBirth = 'Please enter a valid calendar date (DD/MM/YYYY).';
      }
    }

    const roll = (formData.rollNumber || '').trim();
    if (!roll) {
      errors.rollNumber = 'Roll Number is required.';
    }

    const gName = (formData.guardianName || '').trim();
    if (!gName) {
      errors.guardianName = 'Guardian Full Name is required.';
    }

    const gPhone = (formData.guardianPhone || '').trim();
    if (!gPhone) {
      errors.guardianPhone = 'Guardian Phone Number is required.';
    } else if (gPhone.replace(/[^0-9]/g, '').length < 10) {
      errors.guardianPhone = 'Please enter a valid 10-digit phone number.';
    }

    const addr = (formData.address || '').trim();
    if (!addr) {
      errors.address = 'Residential Address is required.';
    }

    const gEmail = (formData.guardianEmail || '').trim();
    if (gEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(gEmail)) {
        errors.guardianEmail = 'Please enter a valid email address.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    const isValid = validateForm();
    if (!isValid) {
      setError('Please correct the highlighted mandatory fields before saving.');
      return;
    }

    setIsLoading(true);

    const adm = (formData.admissionNumber || '').trim().toUpperCase();
    const fn = (formData.firstName || '').trim();
    const ln = (formData.lastName || '').trim();
    const dob = (formData.dateOfBirth || '').trim();
    const roll = (formData.rollNumber || '').trim();
    const gName = (formData.guardianName || '').trim();
    const gPhone = (formData.guardianPhone || '').trim();
    const gEmail = (formData.guardianEmail || '').trim();
    const addr = (formData.address || '').trim();
    const prevSchool = (formData.previousSchool || '').trim();
    const admDate = (formData.admissionDate || '').trim() || new Date().toISOString().split('T')[0];

    try {
      if (isEdit && initialData) {
        const targetId = (initialData.id || (initialData as any).studentId || '').trim();
        if (!targetId) {
          throw new Error('Unable to identify student record ID for updating.');
        }

        // Update Firestore student document
        await studentService.updateStudent(targetId, {
          admissionNumber: adm,
          firstName: fn,
          lastName: ln,
          dateOfBirth: dob,
          gender: formData.gender,
          className: formData.className,
          section: formData.section,
          rollNumber: roll,
          academicYear: formData.academicYear,
          admissionDate: admDate,
          guardianName: gName,
          guardianRelationship: formData.guardianRelationship,
          guardianPhone: gPhone,
          guardianEmail: gEmail || undefined,
          address: addr,
          previousSchool: prevSchool || undefined,
          active: formData.active,
        });

        const updatedStudent: Student = {
          ...(initialData as Student),
          ...formData,
          admissionNumber: adm,
          firstName: fn,
          lastName: ln,
          dateOfBirth: dob,
          rollNumber: roll,
          guardianName: gName,
          guardianPhone: gPhone,
          guardianEmail: gEmail || undefined,
          address: addr,
          previousSchool: prevSchool || undefined,
          id: targetId,
          studentId: initialData.studentId || targetId,
          updatedAt: new Date().toISOString(),
        };

        onSuccess(updatedStudent, true);
        onClose();
      } else {
        // 1. Pre-check Admission Number uniqueness before provisioning Auth
        const expectedStudentId = studentService.generateStudentId(adm, formData.academicYear || '2026-2027');
        const admExists = await studentService.checkAdmissionNumberExists(adm);
        if (admExists) {
          setError(`Admission Number "${adm}" is already assigned to an existing student.`);
          setIsLoading(false);
          return;
        }

        // 2. Step 1 of enrollment: Provision Firebase Authentication account FIRST
        let provisionedUid: string;
        try {
          const provisionResult = await adminBackendService.provisionStudentAccount({
            studentId: expectedStudentId,
            admissionNumber: adm,
            dateOfBirth: dob,
            studentName: `${fn} ${ln}`.trim(),
          });

          if (!provisionResult || !provisionResult.uid) {
            throw new Error('Authentication service did not return a valid Firebase Auth UID.');
          }

          provisionedUid = provisionResult.uid;
        } catch (authErr: any) {
          console.error('Firebase Auth provisioning failed during enrollment:', authErr);
          setError(`Failed to provision student authentication credentials: ${authErr?.message || String(authErr)}. The student record was not created.`);
          setIsLoading(false);
          return;
        }

        // 3. Step 2 of enrollment: Create Firestore student document with the explicit returned authUid
        let createdStudent: Student;
        try {
          createdStudent = await studentService.createStudent(
            {
              admissionNumber: adm,
              firstName: fn,
              lastName: ln,
              dateOfBirth: dob,
              gender: formData.gender || 'Male',
              className: formData.className || 'Class 1',
              section: formData.section || 'A',
              rollNumber: roll,
              academicYear: formData.academicYear || '2026-2027',
              admissionDate: admDate,
              guardianName: gName,
              guardianRelationship: formData.guardianRelationship || 'Father',
              guardianPhone: gPhone,
              guardianEmail: gEmail || undefined,
              address: addr,
              previousSchool: prevSchool || undefined,
              active: formData.active !== undefined ? formData.active : true,
              authUid: provisionedUid,
            },
            expectedStudentId
          );
        } catch (firestoreErr: any) {
          console.error('Firestore student creation failed. Initiating Auth rollback:', firestoreErr);
          // Rollback: remove provisioned auth account to prevent orphaned credentials
          await adminBackendService.rollbackProvisionedStudent(provisionedUid, expectedStudentId, dob);
          throw new Error(`Failed to save student record to database: ${firestoreErr?.message || String(firestoreErr)}. Provisioned auth account has been rolled back.`);
        }

        onSuccess(createdStudent, false);
        onClose();
      }
    } catch (err: any) {
      console.error('Error saving student record:', err);
      setError(err?.message || 'Failed to save student record. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/30 border border-blue-500/40 text-amber-300">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-serif">
                {isEdit ? 'Edit Student Record' : 'Enroll New Student'}
              </h2>
              <p className="text-xs text-slate-300">
                {isEdit
                  ? `Update academic and guardian information for ID: ${displayStudentId}`
                  : 'Official enrollment record stored securely in Firestore /students collection'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex gap-2.5 items-start">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Academic Information */}
          <div>
            <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-100 text-xs font-bold text-slate-900 uppercase tracking-wider">
              <GraduationCap className="w-4 h-4 text-blue-900" />
              1. Academic & Enrollment Details
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Admission Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.admissionNumber}
                  onChange={(e) => handleFieldChange('admissionNumber', e.target.value)}
                  placeholder="e.g. ADM-2026-001"
                  className={`w-full px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 border rounded-lg focus:bg-white focus:ring-2 outline-none uppercase font-mono font-medium ${
                    fieldErrors.admissionNumber
                      ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/30'
                      : 'border-slate-300 focus:ring-blue-900/20 focus:border-blue-900'
                  }`}
                />
                {fieldErrors.admissionNumber ? (
                  <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.admissionNumber}</p>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-0.5">Unique institutional ID</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Class <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.className}
                  onChange={(e) => handleFieldChange('className', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white text-slate-900 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 outline-none font-medium"
                >
                  {CLASS_OPTIONS.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Section <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.section}
                  onChange={(e) => handleFieldChange('section', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white text-slate-900 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 outline-none font-bold"
                >
                  {SECTION_OPTIONS.map((sec) => (
                    <option key={sec} value={sec}>
                      Section {sec}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Class Roll Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.rollNumber}
                  onChange={(e) => handleFieldChange('rollNumber', e.target.value)}
                  placeholder="e.g. 14"
                  className={`w-full px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 border rounded-lg focus:bg-white focus:ring-2 outline-none font-medium ${
                    fieldErrors.rollNumber
                      ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/30'
                      : 'border-slate-300 focus:ring-blue-900/20 focus:border-blue-900'
                  }`}
                />
                {fieldErrors.rollNumber && (
                  <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.rollNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Academic Year <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.academicYear}
                  onChange={(e) => handleFieldChange('academicYear', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white text-slate-900 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 outline-none font-medium"
                >
                  {ACADEMIC_YEARS.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <DateInput
                  id="student-form-admission-date"
                  label="Admission Date"
                  value={formData.admissionDate}
                  onChange={(displayVal, isoVal) => handleFieldChange('admissionDate', isoVal || displayVal)}
                  placeholder="DD/MM/YYYY"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Student Personal Information */}
          <div>
            <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-100 text-xs font-bold text-slate-900 uppercase tracking-wider">
              <User className="w-4 h-4 text-blue-900" />
              2. Student Personal Information
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => handleFieldChange('firstName', e.target.value)}
                  placeholder="e.g. Aarav"
                  className={`w-full px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 border rounded-lg focus:bg-white focus:ring-2 outline-none font-medium ${
                    fieldErrors.firstName
                      ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/30'
                      : 'border-slate-300 focus:ring-blue-900/20 focus:border-blue-900'
                  }`}
                />
                {fieldErrors.firstName && (
                  <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.firstName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => handleFieldChange('lastName', e.target.value)}
                  placeholder="e.g. Mohanty"
                  className={`w-full px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 border rounded-lg focus:bg-white focus:ring-2 outline-none font-medium ${
                    fieldErrors.lastName
                      ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/30'
                      : 'border-slate-300 focus:ring-blue-900/20 focus:border-blue-900'
                  }`}
                />
                {fieldErrors.lastName && (
                  <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.lastName}</p>
                )}
              </div>

              <div>
                <DateInput
                  id="student-form-dob"
                  label="Date of Birth"
                  required
                  value={formData.dateOfBirth}
                  error={fieldErrors.dateOfBirth}
                  onChange={(displayVal, isoVal) => handleFieldChange('dateOfBirth', isoVal || displayVal)}
                  placeholder="DD/MM/YYYY (e.g. 03/02/2015)"
                  helperText="Authoritative format for initial temporary password (DDMMYY)"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gender <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleFieldChange('gender', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white text-slate-900 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 outline-none font-medium"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Previous School (Optional)
                </label>
                <input
                  type="text"
                  value={formData.previousSchool}
                  onChange={(e) => handleFieldChange('previousSchool', e.target.value)}
                  placeholder="e.g. Saraswati Sishu Mandir, Bhadrak"
                  className="w-full px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 outline-none font-medium"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Residential Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => handleFieldChange('address', e.target.value)}
                  placeholder="At/PO - Tihidi, Dist - Bhadrak, Odisha, PIN - 756130"
                  className={`w-full px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 border rounded-lg focus:bg-white focus:ring-2 outline-none font-medium ${
                    fieldErrors.address
                      ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/30'
                      : 'border-slate-300 focus:ring-blue-900/20 focus:border-blue-900'
                  }`}
                />
                {fieldErrors.address && (
                  <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.address}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Guardian & Contact Information */}
          <div>
            <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-100 text-xs font-bold text-slate-900 uppercase tracking-wider">
              <Users className="w-4 h-4 text-blue-900" />
              3. Guardian & Emergency Contact (Student & Guardian Portal)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Guardian Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.guardianName}
                  onChange={(e) => handleFieldChange('guardianName', e.target.value)}
                  placeholder="e.g. Ramesh Chandra Mohanty"
                  className={`w-full px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 border rounded-lg focus:bg-white focus:ring-2 outline-none font-medium ${
                    fieldErrors.guardianName
                      ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/30'
                      : 'border-slate-300 focus:ring-blue-900/20 focus:border-blue-900'
                  }`}
                />
                {fieldErrors.guardianName && (
                  <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.guardianName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Relationship <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.guardianRelationship}
                  onChange={(e) => handleFieldChange('guardianRelationship', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white text-slate-900 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 outline-none font-medium"
                >
                  {RELATIONSHIP_OPTIONS.map((rel) => (
                    <option key={rel} value={rel}>
                      {rel}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Guardian Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.guardianPhone}
                  onChange={(e) => handleFieldChange('guardianPhone', e.target.value)}
                  placeholder="e.g. 9876543210"
                  className={`w-full px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 border rounded-lg focus:bg-white focus:ring-2 outline-none font-mono font-medium ${
                    fieldErrors.guardianPhone
                      ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/30'
                      : 'border-slate-300 focus:ring-blue-900/20 focus:border-blue-900'
                  }`}
                />
                {fieldErrors.guardianPhone && (
                  <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.guardianPhone}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Guardian Email (Optional)
                </label>
                <input
                  type="email"
                  value={formData.guardianEmail}
                  onChange={(e) => handleFieldChange('guardianEmail', e.target.value)}
                  placeholder="guardian@example.com"
                  className={`w-full px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 border rounded-lg focus:bg-white focus:ring-2 outline-none font-medium ${
                    fieldErrors.guardianEmail
                      ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/30'
                      : 'border-slate-300 focus:ring-blue-900/20 focus:border-blue-900'
                  }`}
                />
                {fieldErrors.guardianEmail && (
                  <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.guardianEmail}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Enrollment Status
                </label>
                <div className="flex items-center gap-2 mt-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => handleFieldChange('active', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                  <span className="text-xs font-medium text-slate-700">
                    {formData.active ? 'Active Student' : 'Inactive / On Leave'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Architecture notice */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 leading-relaxed flex gap-2.5 items-start">
            <Info className="w-4 h-4 text-blue-800 shrink-0 mt-0.5" />
            <div>
              <strong>Authentication & Privacy Architecture:</strong> Student master record is stored in Firestore under <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">/students/{`{studentId}`}</code>. Firebase Auth accounts with DOB-based initial credentials are provisioned via trusted Netlify Functions.
            </div>
          </div>

          {/* Modal Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving Record...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  {isEdit ? 'Update Student Record' : 'Save & Register Student'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
