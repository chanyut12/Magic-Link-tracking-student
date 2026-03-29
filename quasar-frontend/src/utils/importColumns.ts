import type { ImportMode } from '../types/import';

export const studentTermColumns = [
  'AcademicYear_Onec',
  'Semester_Onec',
  'DepartmentID_Onec',
  'SchoolID_Onec',
  'PersonID_Onec',
  'PassportNumber_Onec',
  'PrefixID_Onec',
  'FirstName_Onec',
  'MiddleName_Onec',
  'LastName_Onec',
  'GenderID_Onec',
  'NationalityID_Onec',
  'DisabilityID_Onec',
  'DisadvantageEducationID_Onec',
  'VillageNumber_Onec',
  'Street_Onec',
  'Soi_Onec',
  'Trok_Onec',
  'SubDistrictID_Onec',
  'SchoolAdmissionYear_Onec',
  'GradeLevelID_Onec',
  'RoomID_Onec',
  'GPAX_Onec',
  'StudentStatusID_Onec',
  'ProvinceNameThai_Onec',
  'DistrictNameThai_Onec',
  'SubDistrictNameThai_Onec',
] as const;

export const studentDropoutsColumns = [
  'ProvinceNameThai_Onec',
  'DistrictNameThai_Onec',
  'SubDistrictNameThai_Onec',
  'PersonID_Onec',
  'Fullname_Onec',
  'Gender_Onec',
  'NationalityName_Onec',
  'BirthDate_Onec',
  'HouseNumber_Onec',
  'VillageNumber_Onec',
  'Street_Onec',
  'Soi_Onec',
  'Trok_Onec',
  'StatusCodeCause_Onec',
  'Remark_Onec',
  'SchoolName_Onec',
  'GradeLevelID_Onec',
  'AcademicYearPresent_Onec',
  'DropoutTransferID_Onec',
  'ACADYEAR',
  'RoomID_Onec',
  'SchoolID_Onec',
  'GenderID_Onec',
  'GPAX_Onec',
] as const;

export function getImportColumns(mode: ImportMode): readonly string[] {
  return mode === 'student_term' ? studentTermColumns : studentDropoutsColumns;
}

export function buildAutoMappedFields(
  headers: string[],
  columns: readonly string[],
): Record<string, string> {
  const nextMappings: Record<string, string> = {};

  columns.forEach((column) => {
    nextMappings[column] = '';
  });

  columns.forEach((column) => {
    const matchedHeader = headers.find((header) => header.trim().toLowerCase() === column.toLowerCase());
    if (matchedHeader) {
      nextMappings[column] = matchedHeader;
    }
  });

  return nextMappings;
}
