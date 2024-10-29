export interface User {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  bio: string;
  major: string;
  graduationYear: number;
  profilePicture: string;
  createdAt?: string;
}

export interface UserParams {
  id: string;
}

export interface CreateUserBody {
  firstName: string;
  lastName: string;
  email: string;
  bio: string;
  major: string;
  graduationYear: number;
}

export interface UpdateUserBody {
  firstName?: string;
  lastName?: string;
  email?: string;
  bio?: string;
  major?: string;
  graduationYear?: number;
}
