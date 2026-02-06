<?php

return [
    'default_schema' => [
        'sections' => [
            [
                'key' => 'individual_identity',
                'title' => [
                    'en' => 'Identity & Residency',
                    'ar' => 'الهوية والإقامة',
                ],
                'fields' => [
                    [
                        'key' => 'national_id',
                        'type' => 'text',
                        'required' => true,
                        'label' => [
                            'en' => 'National ID / Iqama Number',
                            'ar' => 'رقم الهوية الوطنية / الإقامة',
                        ],
                    ],
                    [
                        'key' => 'passport_number',
                        'type' => 'text',
                        'required' => false,
                        'label' => [
                            'en' => 'Passport Number',
                            'ar' => 'رقم جواز السفر',
                        ],
                    ],
                    [
                        'key' => 'date_of_birth',
                        'type' => 'date',
                        'required' => true,
                        'label' => [
                            'en' => 'Date of Birth',
                            'ar' => 'تاريخ الميلاد',
                        ],
                    ],
                    [
                        'key' => 'nationality',
                        'type' => 'text',
                        'required' => true,
                        'label' => [
                            'en' => 'Nationality',
                            'ar' => 'الجنسية',
                        ],
                    ],
                    [
                        'key' => 'residency_status',
                        'type' => 'select',
                        'required' => true,
                        'label' => [
                            'en' => 'Residency Status',
                            'ar' => 'حالة الإقامة',
                        ],
                        'options' => [
                            'en' => ['Citizen', 'Resident', 'Non-resident'],
                            'ar' => ['مواطن', 'مقيم', 'غير مقيم'],
                        ],
                    ],
                    [
                        'key' => 'address',
                        'type' => 'textarea',
                        'required' => true,
                        'label' => [
                            'en' => 'Residential Address',
                            'ar' => 'العنوان السكني',
                        ],
                    ],
                    [
                        'key' => 'contact_phone',
                        'type' => 'text',
                        'required' => true,
                        'label' => [
                            'en' => 'Mobile Number',
                            'ar' => 'رقم الجوال',
                        ],
                    ],
                    [
                        'key' => 'contact_email',
                        'type' => 'email',
                        'required' => true,
                        'label' => [
                            'en' => 'Email Address',
                            'ar' => 'البريد الإلكتروني',
                        ],
                    ],
                ],
            ],
            [
                'key' => 'risk_compliance',
                'title' => [
                    'en' => 'Risk & Compliance',
                    'ar' => 'الامتثال والمخاطر',
                ],
                'fields' => [
                    [
                        'key' => 'pep_status',
                        'type' => 'checkbox',
                        'required' => true,
                        'label' => [
                            'en' => 'Politically Exposed Person (PEP)',
                            'ar' => 'شخصية سياسية بارزة',
                        ],
                    ],
                    [
                        'key' => 'source_of_funds',
                        'type' => 'select',
                        'required' => true,
                        'label' => [
                            'en' => 'Source of Funds',
                            'ar' => 'مصدر الأموال',
                        ],
                        'options' => [
                            'en' => ['Salary', 'Business Income', 'Investments', 'Inheritance', 'Other'],
                            'ar' => ['راتب', 'دخل تجاري', 'استثمارات', 'ميراث', 'أخرى'],
                        ],
                    ],
                    [
                        'key' => 'source_of_wealth',
                        'type' => 'textarea',
                        'required' => true,
                        'label' => [
                            'en' => 'Source of Wealth',
                            'ar' => 'مصدر الثروة',
                        ],
                    ],
                    [
                        'key' => 'sanctions_declaration',
                        'type' => 'checkbox',
                        'required' => true,
                        'label' => [
                            'en' => 'I confirm I am not subject to sanctions.',
                            'ar' => 'أؤكد أنني لست خاضعًا لعقوبات.',
                        ],
                    ],
                ],
            ],
            [
                'key' => 'entity_profile',
                'title' => [
                    'en' => 'Entity Profile',
                    'ar' => 'بيانات الكيان',
                ],
                'fields' => [
                    [
                        'key' => 'entity_name',
                        'type' => 'text',
                        'required' => true,
                        'label' => [
                            'en' => 'Legal Entity Name',
                            'ar' => 'الاسم القانوني للكيان',
                        ],
                    ],
                    [
                        'key' => 'commercial_registration',
                        'type' => 'text',
                        'required' => true,
                        'label' => [
                            'en' => 'Commercial Registration (CR) Number',
                            'ar' => 'رقم السجل التجاري',
                        ],
                    ],
                    [
                        'key' => 'entity_address',
                        'type' => 'textarea',
                        'required' => true,
                        'label' => [
                            'en' => 'Registered Address',
                            'ar' => 'العنوان المسجل',
                        ],
                    ],
                    [
                        'key' => 'industry',
                        'type' => 'text',
                        'required' => true,
                        'label' => [
                            'en' => 'Industry / Sector',
                            'ar' => 'القطاع',
                        ],
                    ],
                    [
                        'key' => 'tax_residency',
                        'type' => 'text',
                        'required' => true,
                        'label' => [
                            'en' => 'Tax Residency',
                            'ar' => 'الإقامة الضريبية',
                        ],
                    ],
                ],
            ],
            [
                'key' => 'ubo',
                'title' => [
                    'en' => 'Ultimate Beneficial Owners (UBO)',
                    'ar' => 'المالكون المستفيدون النهائيون',
                ],
                'fields' => [
                    [
                        'key' => 'ubo_list',
                        'type' => 'repeatable',
                        'required' => true,
                        'label' => [
                            'en' => 'UBO Details',
                            'ar' => 'تفاصيل المالك المستفيد',
                        ],
                        'fields' => [
                            [
                                'key' => 'ubo_name',
                                'type' => 'text',
                                'label' => [
                                    'en' => 'Full Name',
                                    'ar' => 'الاسم الكامل',
                                ],
                            ],
                            [
                                'key' => 'ubo_nationality',
                                'type' => 'text',
                                'label' => [
                                    'en' => 'Nationality',
                                    'ar' => 'الجنسية',
                                ],
                            ],
                            [
                                'key' => 'ubo_ownership',
                                'type' => 'number',
                                'label' => [
                                    'en' => 'Ownership %',
                                    'ar' => 'نسبة الملكية',
                                ],
                            ],
                            [
                                'key' => 'ubo_id_number',
                                'type' => 'text',
                                'label' => [
                                    'en' => 'ID / Iqama / Passport',
                                    'ar' => 'رقم الهوية / الإقامة / الجواز',
                                ],
                            ],
                            [
                                'key' => 'ubo_pep',
                                'type' => 'checkbox',
                                'label' => [
                                    'en' => 'PEP Status',
                                    'ar' => 'حالة PEP',
                                ],
                            ],
                        ],
                    ],
                ],
            ],
            [
                'key' => 'documents',
                'title' => [
                    'en' => 'Supporting Documents',
                    'ar' => 'المستندات الداعمة',
                ],
                'fields' => [
                    [
                        'key' => 'id_document',
                        'type' => 'file',
                        'required' => true,
                        'label' => [
                            'en' => 'National ID / Iqama Copy',
                            'ar' => 'نسخة الهوية / الإقامة',
                        ],
                    ],
                    [
                        'key' => 'passport_copy',
                        'type' => 'file',
                        'required' => false,
                        'label' => [
                            'en' => 'Passport Copy (if applicable)',
                            'ar' => 'نسخة جواز السفر',
                        ],
                    ],
                    [
                        'key' => 'proof_of_address',
                        'type' => 'file',
                        'required' => true,
                        'label' => [
                            'en' => 'Proof of Address',
                            'ar' => 'إثبات العنوان',
                        ],
                    ],
                    [
                        'key' => 'commercial_registration_doc',
                        'type' => 'file',
                        'required' => true,
                        'label' => [
                            'en' => 'Commercial Registration (CR)',
                            'ar' => 'السجل التجاري',
                        ],
                    ],
                    [
                        'key' => 'board_resolution',
                        'type' => 'file',
                        'required' => false,
                        'label' => [
                            'en' => 'Board Resolution / Authorized Signatory',
                            'ar' => 'تفويض التوقيع / قرار مجلس الإدارة',
                        ],
                    ],
                ],
            ],
        ],
    ],
];
