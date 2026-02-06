export const mockTemplates = [
  {
    id: 'tmpl-001',
    name: 'Saudi KYC Master',
    updatedAt: 'Feb 5, 2026',
    sections: [
      {
        id: 'sec-identity',
        title: { en: 'Identity & Residency', ar: 'الهوية والإقامة' },
        fields: [
          {
            id: 'national-id',
            label: { en: 'National ID / Iqama Number', ar: 'رقم الهوية الوطنية / الإقامة' },
            type: 'text',
            required: true,
          },
          {
            id: 'passport',
            label: { en: 'Passport Number', ar: 'رقم جواز السفر' },
            type: 'text',
            required: false,
          },
          {
            id: 'dob',
            label: { en: 'Date of Birth', ar: 'تاريخ الميلاد' },
            type: 'date',
            required: true,
          },
        ],
      },
      {
        id: 'sec-risk',
        title: { en: 'Risk & Compliance', ar: 'الامتثال والمخاطر' },
        fields: [
          {
            id: 'pep',
            label: { en: 'Politically Exposed Person (PEP)', ar: 'شخصية سياسية بارزة' },
            type: 'checkbox',
            required: true,
          },
          {
            id: 'source-of-funds',
            label: { en: 'Source of Funds', ar: 'مصدر الأموال' },
            type: 'select',
            required: true,
          },
        ],
      },
    ],
  },
]

export const mockSubmission = {
  id: 'sub-2044',
  investorName: 'Noura Al Harbi',
  status: 'needs_changes',
  submittedAt: 'Feb 4, 2026',
  reviewer: 'Omar Al Qassim',
  sections: [
    {
      id: 'sec-identity',
      title: { en: 'Identity & Residency', ar: 'الهوية والإقامة' },
      fields: [
        {
          id: 'national-id',
          label: { en: 'National ID / Iqama Number', ar: 'رقم الهوية الوطنية / الإقامة' },
          value: '1023 4456 9876',
          comment: 'Please upload the ID document for verification.',
        },
        {
          id: 'dob',
          label: { en: 'Date of Birth', ar: 'تاريخ الميلاد' },
          value: '1992-04-12',
          comment: '',
        },
      ],
    },
    {
      id: 'sec-risk',
      title: { en: 'Risk & Compliance', ar: 'الامتثال والمخاطر' },
      fields: [
        {
          id: 'pep',
          label: { en: 'PEP Status', ar: 'حالة PEP' },
          value: 'No',
          comment: 'Confirm no public position in the last 5 years.',
        },
      ],
    },
  ],
}

export const mockApprovalChain = [
  {
    id: 'approver-1',
    name: 'Aisha Al Saud',
    role: 'GP Reviewer',
    status: 'approved',
    timestamp: 'Feb 4, 2026 · 10:21',
  },
  {
    id: 'approver-2',
    name: 'Faisal Al Mutairi',
    role: 'Risk Lead',
    status: 'pending',
    timestamp: 'Waiting',
  },
  {
    id: 'approver-3',
    name: 'Huda Al Rashid',
    role: 'Compliance Officer',
    status: 'locked',
    timestamp: 'Locked until prior approval',
  },
]

export const mockLpProfile = {
  name: 'Noura Al Harbi',
  email: 'noura@example.com',
  forms: [
    {
      id: 'form-101',
      title: 'Saudi KYC Master',
      status: 'Approved',
      updatedAt: 'Feb 5, 2026',
      pdfReady: true,
    },
    {
      id: 'form-102',
      title: 'Fund Subscription Addendum',
      status: 'In Review',
      updatedAt: 'Feb 3, 2026',
      pdfReady: false,
    },
  ],
}
