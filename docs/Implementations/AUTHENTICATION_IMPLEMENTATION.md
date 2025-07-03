# Authentication System Implementation

## 1. NextAuth.js Configuration

```typescript
// src/lib/auth.ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
          include: {
            departmentRoles: {
              include: {
                department: true
              }
            }
          }
        });

        if (!user || !user.isActive) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          departmentRoles: user.departmentRoles
        };
      }
    })
  ],
  session: {
    strategy: 'jwt' as const,
    maxAge: 8 * 60 * 60, // 8 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.departmentRoles = user.departmentRoles;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as UserRole;
        session.user.departmentRoles = token.departmentRoles as DepartmentRole[];
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  }
};

export default NextAuth(authOptions);
```

## 2. Database Schema

```prisma
model User {
  id                String              @id @default(cuid())
  username          String              @unique
  email             String?             @unique
  name              String
  passwordHash      String
  role              UserRole            @default(OPERATOR)
  isActive          Boolean             @default(true)
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  lastLoginAt       DateTime?
  
  // Relations
  departmentRoles   UserDepartmentRole[]
  productionEvents  ProductionEvent[]
  createdWorkOrders WorkOrder[]         @relation("CreatedBy")
  passwordResetTokens PasswordResetToken[]
  
  // NextAuth
  accounts          Account[]
  sessions          Session[]
  
  @@map("users")
}

model UserDepartmentRole {
  id           String         @id @default(cuid())
  userId       String
  departmentId String
  role         DepartmentRole
  isActive     Boolean        @default(true)
  assignedAt   DateTime       @default(now())
  
  user         User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  department   Department     @relation(fields: [departmentId], references: [id])
  
  @@unique([userId, departmentId])
  @@map("user_department_roles")
}

model PasswordResetToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("password_reset_tokens")
}

enum UserRole {
  ADMIN
  SUPERVISOR
  OPERATOR
}

enum DepartmentRole {
  CAPO_REPARTO
  CAPO_TURNO
  OPERATORE
}
```

## 3. Authentication Utilities

```typescript
// src/lib/auth-utils.ts
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from './prisma';

export class AuthUtils {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static async createUser(userData: {
    username: string;
    email?: string;
    name: string;
    password: string;
    role?: UserRole;
  }) {
    const passwordHash = await this.hashPassword(userData.password);
    
    return prisma.user.create({
      data: {
        username: userData.username,
        email: userData.email,
        name: userData.name,
        passwordHash,
        role: userData.role || 'OPERATOR'
      }
    });
  }

  static async createPasswordResetToken(userId: string): Promise<string> {
    const token = this.generateResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId,
        expiresAt
      }
    });

    return token;
  }

  static async validateResetToken(token: string) {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      return null;
    }

    return resetToken;
  }

  static async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const resetToken = await this.validateResetToken(token);
    
    if (!resetToken) {
      return false;
    }

    const passwordHash = await this.hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash }
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() }
      })
    ]);

    return true;
  }
}
```

## 4. Middleware for Route Protection

```typescript
// src/middleware.ts
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Admin routes
    if (path.startsWith('/admin') && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    // Supervisor routes
    if (path.startsWith('/reports') && !['ADMIN', 'SUPERVISOR'].includes(token?.role)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to auth pages without token
        if (req.nextUrl.pathname.startsWith('/login') || 
            req.nextUrl.pathname.startsWith('/register') ||
            req.nextUrl.pathname.startsWith('/forgot-password') ||
            req.nextUrl.pathname.startsWith('/reset-password')) {
          return true;
        }

        // Require token for all other pages
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/((?!api/health|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

## 5. Authentication API Routes

### Login/Register
```typescript
// src/app/api/auth/register/route.ts
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, email, name, password } = body;

    // Validate input
    if (!username || !name || !password) {
      return NextResponse.json(
        { error: 'Campi richiesti mancanti' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username già esistente' },
        { status: 409 }
      );
    }

    // Create user
    const user = await AuthUtils.createUser({
      username,
      email,
      name,
      password
    });

    return NextResponse.json({
      message: 'Utente creato con successo',
      userId: user.id
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
```

### Password Reset
```typescript
// src/app/api/auth/forgot-password/route.ts
export async function POST(request: Request) {
  try {
    const { username } = await request.json();

    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      // Don't reveal if user exists
      return NextResponse.json({
        message: 'Se l\'utente esiste, riceverà un email'
      });
    }

    const token = await AuthUtils.createPasswordResetToken(user.id);
    
    // TODO: Send email with reset link
    // await sendPasswordResetEmail(user.email, token);

    return NextResponse.json({
      message: 'Email di reset inviata'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore interno' },
      { status: 500 }
    );
  }
}

// src/app/api/auth/reset-password/route.ts
export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    const success = await AuthUtils.resetPassword(token, password);

    if (!success) {
      return NextResponse.json(
        { error: 'Token non valido o scaduto' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Password aggiornata con successo'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore interno' },
      { status: 500 }
    );
  }
}
```

## 6. Authentication Components

### Login Form
```typescript
// src/components/auth/LoginForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';

const loginSchema = z.object({
  username: z.string().min(1, 'Username richiesto'),
  password: z.string().min(1, 'Password richiesta')
});

export const LoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    
    try {
      const result = await signIn('credentials', {
        username: data.username,
        password: data.password,
        redirect: false
      });

      if (result?.error) {
        setError('Credenziali non valide');
      } else {
        router.push('/');
      }
    } catch (error) {
      setError('Errore di connessione');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField
            {...register('username')}
            label="Username"
            error={!!errors.username}
            helperText={errors.username?.message}
            fullWidth
            margin="normal"
          />
          <TextField
            {...register('password')}
            type="password"
            label="Password"
            error={!!errors.password}
            helperText={errors.password?.message}
            fullWidth
            margin="normal"
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isLoading}
            sx={{ mt: 2 }}
          >
            {isLoading ? 'Accesso...' : 'Accedi'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
```

### Role Guard Component
```typescript
// src/components/auth/RoleGuard.tsx
import { useSession } from 'next-auth/react';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGuard = ({ allowedRoles, children, fallback }: RoleGuardProps) => {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <CircularProgress />;
  }

  if (!session || !allowedRoles.includes(session.user.role)) {
    return fallback || <Typography>Accesso negato</Typography>;
  }

  return <>{children}</>;
};
```

## 7. Custom Hooks

```typescript
// src/hooks/useAuth.ts
import { useSession } from 'next-auth/react';

export const useAuth = () => {
  const { data: session, status } = useSession();

  const hasRole = (role: UserRole): boolean => {
    return session?.user.role === role;
  };

  const hasDepartmentRole = (departmentId: string, role: DepartmentRole): boolean => {
    return session?.user.departmentRoles?.some(
      dr => dr.departmentId === departmentId && dr.role === role
    ) || false;
  };

  const isAdmin = (): boolean => hasRole('ADMIN');
  const isSupervisor = (): boolean => hasRole('SUPERVISOR');
  const isOperator = (): boolean => hasRole('OPERATOR');

  return {
    user: session?.user,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    hasRole,
    hasDepartmentRole,
    isAdmin,
    isSupervisor,
    isOperator
  };
};
```