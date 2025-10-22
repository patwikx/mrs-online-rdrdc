// prisma/seed.ts
import { PrismaClient, UserRole, ApproverType } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

interface SeedUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  contactNo?: string;
}

interface SeedBusinessUnit {
  code: string;
  name: string;
  description: string;
}

interface SeedDepartment {
  code: string;
  name: string;
  description: string;
}

async function main() {
  console.log('🌱 Starting MRS seed...');

  // ==========================================
  // 1. CREATE BUSINESS UNITS
  // ==========================================
  console.log('📦 Creating Business Units...');

  const businessUnits: SeedBusinessUnit[] = [
    {
      code: 'RDRC',
      name: 'RD Realty Development Corporation',
      description: 'Real estate development and property management',
    },
    {
      code: 'RLII',
      name: 'Richmond Land Innovations Inc',
      description: 'Land development and innovation projects',
    },
  ];

  const createdBusinessUnits = await Promise.all(
    businessUnits.map(async (bu) => {
      return await prisma.businessUnit.upsert({
        where: { code: bu.code },
        update: {},
        create: {
          code: bu.code,
          name: bu.name,
          description: bu.description,
          isActive: true,
        },
      });
    })
  );

  console.log(`✅ Created ${createdBusinessUnits.length} business units`);

  // ==========================================
  // 2. CREATE DEPARTMENTS FOR EACH BUSINESS UNIT
  // ==========================================
  console.log('🏢 Creating Departments...');

  const departments: Record<string, SeedDepartment[]> = {
    RDRC: [
      { code: 'RDRC-FIN', name: 'Finance Department', description: 'Financial management and accounting' },
      { code: 'RDRC-OPS', name: 'Operations Department', description: 'Daily operations and management' },
      { code: 'RDRC-HR', name: 'Human Resources', description: 'Employee management and recruitment' },
      { code: 'RDRC-IT', name: 'IT Department', description: 'Technology and systems management' },
      { code: 'RDRC-PROC', name: 'Procurement Department', description: 'Purchasing and procurement' },
    ],
    RLII: [
      { code: 'RLII-FIN', name: 'Finance Department', description: 'Financial management and accounting' },
      { code: 'RLII-PROJ', name: 'Project Management', description: 'Project planning and execution' },
      { code: 'RLII-ENG', name: 'Engineering Department', description: 'Technical and engineering services' },
      { code: 'RLII-PROC', name: 'Procurement Department', description: 'Purchasing and procurement' },
      { code: 'RLII-QA', name: 'Quality Assurance', description: 'Quality control and standards' },
    ],
  };

  const createdDepartments: Record<string, Awaited<ReturnType<typeof prisma.department.create>>[]> = {};

  for (const bu of createdBusinessUnits) {
    const depts = departments[bu.code] || [];
    createdDepartments[bu.code] = await Promise.all(
      depts.map(async (dept) => {
        return await prisma.department.upsert({
          where: { code: dept.code },
          update: {},
          create: {
            code: dept.code,
            name: dept.name,
            description: dept.description,
            businessUnitId: bu.id,
            isActive: true,
          },
        });
      })
    );
  }

  console.log(`✅ Created departments for all business units`);

  // ==========================================
  // 3. CREATE USERS
  // ==========================================
  console.log('👥 Creating Users...');

  const defaultPassword = await bcryptjs.hash('asdasd123', 10);

  // Admin users (no department restriction)
  const adminUsers: SeedUser[] = [
    {
      firstName: 'John',
      lastName: 'Admin',
      email: 'admin@rdrealty.com',
      password: defaultPassword,
      role: 'ADMIN',
      contactNo: '+63917-123-4567',
    },
    {
      firstName: 'Sarah',
      lastName: 'Owner',
      email: 'owner@rdrealty.com',
      password: defaultPassword,
      role: 'OWNER',
      contactNo: '+63917-123-4568',
    },
  ];

  const createdAdmins = await Promise.all(
    adminUsers.map(async (user) => {
      return await prisma.user.upsert({
        where: { email: user.email },
        update: {},
        create: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          password: user.password,
          contactNo: user.contactNo,
          role: user.role,
        },
      });
    })
  );

  console.log(`✅ Created ${createdAdmins.length} admin users`);

  // RDRC Users
  const rdrcFinDept = createdDepartments['RDRC'].find((d) => d.code === 'RDRC-FIN');
  const rdrcOpsDept = createdDepartments['RDRC'].find((d) => d.code === 'RDRC-OPS');
  const rdrcProcDept = createdDepartments['RDRC'].find((d) => d.code === 'RDRC-PROC');
  const rdrcITDept = createdDepartments['RDRC'].find((d) => d.code === 'RDRC-IT');

  const rdrcUsers: Array<SeedUser & { departmentId?: string }> = [
    // Finance Department
    {
      firstName: 'Maria',
      lastName: 'Santos',
      email: 'maria.santos@rdrealty.com',
      password: defaultPassword,
      role: 'MANAGER',
      contactNo: '+63917-234-5678',
      departmentId: rdrcFinDept?.id,
    },
    {
      firstName: 'Robert',
      lastName: 'Cruz',
      email: 'robert.cruz@rdrealty.com',
      password: defaultPassword,
      role: 'ACCTG',
      contactNo: '+63917-234-5679',
      departmentId: rdrcFinDept?.id,
    },
    {
      firstName: 'Lisa',
      lastName: 'Reyes',
      email: 'lisa.reyes@rdrealty.com',
      password: defaultPassword,
      role: 'TREASURY',
      contactNo: '+63917-234-5680',
      departmentId: rdrcFinDept?.id,
    },
    // Operations Department
    {
      firstName: 'Michael',
      lastName: 'Garcia',
      email: 'michael.garcia@rdrealty.com',
      password: defaultPassword,
      role: 'MANAGER',
      contactNo: '+63917-345-6789',
      departmentId: rdrcOpsDept?.id,
    },
    {
      firstName: 'Jennifer',
      lastName: 'Lopez',
      email: 'jennifer.lopez@rdrealty.com',
      password: defaultPassword,
      role: 'STAFF',
      contactNo: '+63917-345-6790',
      departmentId: rdrcOpsDept?.id,
    },
    // Procurement Department
    {
      firstName: 'David',
      lastName: 'Tan',
      email: 'david.tan@rdrealty.com',
      password: defaultPassword,
      role: 'PURCHASER',
      contactNo: '+63917-456-7891',
      departmentId: rdrcProcDept?.id,
    },
    {
      firstName: 'Anna',
      lastName: 'Rivera',
      email: 'anna.rivera@rdrealty.com',
      password: defaultPassword,
      role: 'PURCHASER',
      contactNo: '+63917-456-7892',
      departmentId: rdrcProcDept?.id,
    },
    // IT Department
    {
      firstName: 'James',
      lastName: 'Wilson',
      email: 'james.wilson@rdrealty.com',
      password: defaultPassword,
      role: 'STAFF',
      contactNo: '+63917-567-8901',
      departmentId: rdrcITDept?.id,
    },
  ];

  // RLII Users
  const rliiFinDept = createdDepartments['RLII'].find((d) => d.code === 'RLII-FIN');
  const rliiProjDept = createdDepartments['RLII'].find((d) => d.code === 'RLII-PROJ');
  const rliiEngDept = createdDepartments['RLII'].find((d) => d.code === 'RLII-ENG');
  const rliiProcDept = createdDepartments['RLII'].find((d) => d.code === 'RLII-PROC');

  const rliiUsers: Array<SeedUser & { departmentId?: string }> = [
    // Finance Department
    {
      firstName: 'Patricia',
      lastName: 'Hernandez',
      email: 'patricia.hernandez@richmondland.com',
      password: defaultPassword,
      role: 'MANAGER',
      contactNo: '+63917-678-9012',
      departmentId: rliiFinDept?.id,
    },
    {
      firstName: 'Daniel',
      lastName: 'Ramos',
      email: 'daniel.ramos@richmondland.com',
      password: defaultPassword,
      role: 'ACCTG',
      contactNo: '+63917-678-9013',
      departmentId: rliiFinDept?.id,
    },
    // Project Management
    {
      firstName: 'Elizabeth',
      lastName: 'Mendoza',
      email: 'elizabeth.mendoza@richmondland.com',
      password: defaultPassword,
      role: 'MANAGER',
      contactNo: '+63917-789-0123',
      departmentId: rliiProjDept?.id,
    },
    {
      firstName: 'Carlos',
      lastName: 'Bautista',
      email: 'carlos.bautista@richmondland.com',
      password: defaultPassword,
      role: 'STAFF',
      contactNo: '+63917-789-0124',
      departmentId: rliiProjDept?.id,
    },
    // Engineering Department
    {
      firstName: 'Stephanie',
      lastName: 'Flores',
      email: 'stephanie.flores@richmondland.com',
      password: defaultPassword,
      role: 'STAFF',
      contactNo: '+63917-890-1234',
      departmentId: rliiEngDept?.id,
    },
    {
      firstName: 'Ryan',
      lastName: 'Castillo',
      email: 'ryan.castillo@richmondland.com',
      password: defaultPassword,
      role: 'STAFF',
      contactNo: '+63917-890-1235',
      departmentId: rliiEngDept?.id,
    },
    // Procurement Department
    {
      firstName: 'Michelle',
      lastName: 'Torres',
      email: 'michelle.torres@richmondland.com',
      password: defaultPassword,
      role: 'PURCHASER',
      contactNo: '+63917-901-2345',
      departmentId: rliiProcDept?.id,
    },
  ];

  const allDepartmentUsers = [...rdrcUsers, ...rliiUsers];

  const createdDepartmentUsers = await Promise.all(
    allDepartmentUsers.map(async (user) => {
      return await prisma.user.upsert({
        where: { email: user.email },
        update: {},
        create: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          password: user.password,
          contactNo: user.contactNo,
          role: user.role,
          mrsDepartmentId: user.departmentId,
        },
      });
    })
  );

  console.log(`✅ Created ${createdDepartmentUsers.length} department users`);

  // ==========================================
  // 4. ASSIGN DEPARTMENT APPROVERS
  // ==========================================
  console.log('✅ Assigning Department Approvers...');

  // RDRC Approvers
  const rdrcFinManager = createdDepartmentUsers.find((u) => u.email === 'maria.santos@rdrealty.com');
  const rdrcOpsManager = createdDepartmentUsers.find((u) => u.email === 'michael.garcia@rdrealty.com');

  if (rdrcFinDept && rdrcFinManager) {
    // Recommending Approver for Finance
    await prisma.departmentApprover.upsert({
      where: {
        departmentId_userId_approverType: {
          departmentId: rdrcFinDept.id,
          userId: rdrcFinManager.id,
          approverType: 'RECOMMENDING',
        },
      },
      update: {},
      create: {
        departmentId: rdrcFinDept.id,
        userId: rdrcFinManager.id,
        approverType: 'RECOMMENDING',
        isActive: true,
      },
    });
  }

  if (rdrcFinDept && rdrcOpsManager) {
    // Final Approver for Finance (Ops Manager)
    await prisma.departmentApprover.upsert({
      where: {
        departmentId_userId_approverType: {
          departmentId: rdrcFinDept.id,
          userId: rdrcOpsManager.id,
          approverType: 'FINAL',
        },
      },
      update: {},
      create: {
        departmentId: rdrcFinDept.id,
        userId: rdrcOpsManager.id,
        approverType: 'FINAL',
        isActive: true,
      },
    });
  }

  if (rdrcOpsDept && rdrcOpsManager) {
    // Recommending Approver for Operations
    await prisma.departmentApprover.upsert({
      where: {
        departmentId_userId_approverType: {
          departmentId: rdrcOpsDept.id,
          userId: rdrcOpsManager.id,
          approverType: 'RECOMMENDING',
        },
      },
      update: {},
      create: {
        departmentId: rdrcOpsDept.id,
        userId: rdrcOpsManager.id,
        approverType: 'RECOMMENDING',
        isActive: true,
      },
    });
  }

  // RLII Approvers
  const rliiFinManager = createdDepartmentUsers.find((u) => u.email === 'patricia.hernandez@richmondland.com');
  const rliiProjManager = createdDepartmentUsers.find((u) => u.email === 'elizabeth.mendoza@richmondland.com');

  if (rliiFinDept && rliiFinManager) {
    // Recommending Approver for Finance
    await prisma.departmentApprover.upsert({
      where: {
        departmentId_userId_approverType: {
          departmentId: rliiFinDept.id,
          userId: rliiFinManager.id,
          approverType: 'RECOMMENDING',
        },
      },
      update: {},
      create: {
        departmentId: rliiFinDept.id,
        userId: rliiFinManager.id,
        approverType: 'RECOMMENDING',
        isActive: true,
      },
    });
  }

  if (rliiProjDept && rliiProjManager) {
    // Recommending Approver for Project Management
    await prisma.departmentApprover.upsert({
      where: {
        departmentId_userId_approverType: {
          departmentId: rliiProjDept.id,
          userId: rliiProjManager.id,
          approverType: 'RECOMMENDING',
        },
      },
      update: {},
      create: {
        departmentId: rliiProjDept.id,
        userId: rliiProjManager.id,
        approverType: 'RECOMMENDING',
        isActive: true,
      },
    });
  }

  if (rliiProjDept && rliiFinManager) {
    // Final Approver for Project Management (Finance Manager)
    await prisma.departmentApprover.upsert({
      where: {
        departmentId_userId_approverType: {
          departmentId: rliiProjDept.id,
          userId: rliiFinManager.id,
          approverType: 'FINAL',
        },
      },
      update: {},
      create: {
        departmentId: rliiProjDept.id,
        userId: rliiFinManager.id,
        approverType: 'FINAL',
        isActive: true,
      },
    });
  }

  console.log('✅ Department approvers assigned');

  // ==========================================
  // SUMMARY
  // ==========================================
  console.log('\n🎉 Seed completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   - Business Units: ${createdBusinessUnits.length}`);
  console.log(`   - Departments: ${Object.values(createdDepartments).flat().length}`);
  console.log(`   - Admin Users: ${createdAdmins.length}`);
  console.log(`   - Department Users: ${createdDepartmentUsers.length}`);
  console.log('\n🔐 Default Password: Password123!');
  console.log('\n📧 Sample Login Credentials:');
  console.log('   Admin: admin@rdrealty.com / Password123!');
  console.log('   Manager (RDRC): maria.santos@rdrealty.com / Password123!');
  console.log('   Manager (RLII): patricia.hernandez@richmondland.com / Password123!');
  console.log('   Purchaser: david.tan@rdrealty.com / Password123!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });