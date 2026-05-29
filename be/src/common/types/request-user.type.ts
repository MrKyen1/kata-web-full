export interface RequestUser {
  id: string;
  code: string;
  phone: string;
  email: string | null;
  roleId: string;
  roleCode: string;
  permissions: string[];
}
