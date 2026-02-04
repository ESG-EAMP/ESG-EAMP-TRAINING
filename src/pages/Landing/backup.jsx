import React, { useEffect, useState } from 'react';
import LandingLayout from '../../layouts/LandingLayout/LandingLayout';
import { useLocation } from 'react-router-dom';
import Empty from '../../components/Empty';

function LearningMaterials({ landing = false }) {
    const [sections, setSections] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const location = useLocation();
    const selectedCategory = (() => {
        try {
            const params = new URLSearchParams(location.search);
            return params.get('category');
        } catch (e) {
            return null;
        }
    })();

    // Helper function to convert section name to URL-friendly ID
    const getSectionId = (sectionName) => {
        if (!sectionName) return '';
        return sectionName
            .toLowerCase()
            .replace(/&/g, 'and')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    // Scroll to section if hash is present
    useEffect(() => {
        const scrollToSection = () => {
            const hash = window.location.hash;
            if (hash) {
                const sectionId = hash.substring(1); // Remove the #
                const element = document.getElementById(sectionId);
                if (element) {
                    // Small delay to ensure DOM is ready
                    setTimeout(() => {
                        const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
                        const viewportHeight = window.innerHeight;
                        // Scroll to 5% from top of viewport
                        const scrollPosition = elementTop - (viewportHeight * 0.08);
                        window.scrollTo({
                            top: Math.max(0, scrollPosition),
                            behavior: 'smooth'
                        });
                    }, 100);
                }
            }
        };

        // Check on mount and when sections are loaded
        if (!loading && sections.length > 0) {
            scrollToSection();
        }

        // Listen for hash changes
        const handleHashChange = () => {
            scrollToSection();
        };

        window.addEventListener('hashchange', handleHashChange);

        return () => {
            window.removeEventListener('hashchange', handleHashChange);
        };
    }, [loading, sections]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const hardcodedSections = [
                    { id: '1', category: 'ESG & Sustainability', title: 'ESG & Sustainability', status: 'Published', order: 1 },
                    { id: '2', category: 'Website & Platform', title: 'Website & Platform', status: 'Published', order: 2 },
                    { id: '3', category: 'Resources', title: 'Resources', status: 'Published', order: 3 },
                    { id: '4', category: 'Certification', title: 'Certification', status: 'Published', order: 4 },
                    { id: '5', category: 'Financing & Incentives', title: 'Financing & Incentives', status: 'Published', order: 5 },
                    { id: '6', category: 'ESG Champion', title: 'ESG Champion', status: 'Published', order: 6 }
                ];

                const hardcodedMaterials = [
                    {
                        id: '100',
                        title: 'What is ESG?',
                        description: 'ESG stands for Environmental, Social and Governance. A holistic approach to sustainability that goes beyond CSR, demanding transparency and managing financial risks tied to sustainability efforts.',
                        type: 'Overview',
                        category: 'ESG & Sustainability',
                        status: 'Published',
                        external_url: 'https://www.msmecompass.org/',
                        image_url: '/assets/learning-materials/bursa-malaysia.png'
                    },
                    {
                        id: '101',
                        title: 'ESG Components: Environmental',
                        description: 'Emission management (GHG Protocol: Scope 1, 2 & 3), energy management, water management, and waste management — how a company impacts the planet.',
                        type: 'Component',
                        category: 'ESG & Sustainability',
                        status: 'Published',
                        external_url: 'https://ghgprotocol.org/',
                        image_url: '/assets/learning-materials/sdg-centre-kl.png'
                    },
                    {
                        id: '101b',
                        title: 'ESG Components: Social',
                        description: 'Labour practices & standards, safety & health, employee benefits, and corporate social responsibility — how a company manages relationships with people and society.',
                        type: 'Component',
                        category: 'ESG & Sustainability',
                        status: 'Published',
                        external_url: 'https://www.ilo.org/',
                        image_url: '/assets/learning-materials/sdg-centre-kl.png'
                    },
                    {
                        id: '101c',
                        title: 'ESG Components: Governance',
                        description: 'Culture & commitment, integrity & anti‑corruption, risk governance & internal controls, strategic decision‑making, disclosure, transparency & data protection — how a company is governed and structured.',
                        type: 'Component',
                        category: 'ESG & Sustainability',
                        status: 'Published',
                        external_url: 'https://oecd.org/corporate/',
                        image_url: '/assets/learning-materials/sdg-centre-kl.png'
                    },
                    {
                        id: '102',
                        title: 'What is Sustainability?',
                        description: 'Meeting present needs without compromising the ability of future generations to meet their own needs. — Brundtland Report, 1987.',
                        type: 'Definition',
                        category: 'ESG & Sustainability',
                        status: 'Published',
                        external_url: 'https://sustainabledevelopment.un.org/content/documents/5987our-common-future.pdf',
                        image_url: '/assets/learning-materials/malaysia-sdg.png'
                    },
                    {
                        id: '102b',
                        title: 'Three Pillars of Sustainability',
                        description: 'Environmental: protect ecosystems, reduce emissions, manage resources responsibly. Social: equitable access, social justice & well‑being, cultural identity & community health. Economic: inclusive, resilient systems; fair trade and ethical business; responsible growth.',
                        type: 'Pillars',
                        category: 'ESG & Sustainability',
                        status: 'Published',
                        external_url: 'https://sdgs.un.org/2030agenda',
                        image_url: '/assets/learning-materials/malaysia-sdg.png'
                    },
                    {
                        id: '103',
                        title: 'What is SDG?',
                        description: 'Sustainable Development Goals: 17 global goals set by the United Nations in 2015, part of the 2030 Agenda for Sustainable Development.',
                        type: 'SDG',
                        category: 'ESG & Sustainability',
                        status: 'Published',
                        external_url: 'https://sdgs.un.org/goals',
                        image_url: '/assets/learning-materials/malaysia-sdg.png'
                    },
                    {
                        id: '103b',
                        title: 'SDG Icons',
                        description: 'The 17 SDG icons represent global priorities ranging from poverty and hunger to climate action, life below water, and partnerships.',
                        type: 'SDG Icons',
                        category: 'ESG & Sustainability',
                        status: 'Published',
                        external_url: 'https://www.un.org/sustainabledevelopment/sustainable-development-goals/',
                        image_url: '/assets/learning-materials/malaysia-sdg.png'
                    },
                    {
                        id: '104',
                        title: 'In short: ESG, SDGs and Purpose',
                        description: 'SDGs provide the destination, ESG is the vehicle, and sustainability is the purpose. Malaysia commits to 45% reduction in GHG emissions intensity vs 2005 by 2030 and net‑zero by 2050.',
                        type: 'Summary',
                        category: 'ESG & Sustainability',
                        status: 'Published',
                        external_url: 'https://www.economy.gov.my/',
                        image_url: '/assets/learning-materials/nep.jpg'
                    },
                    {
                        id: '1',
                        title: 'CSI Bursa Malaysia',
                        description: 'Corporate Sustainability Index platform for Malaysian companies to track and report sustainability performance.',
                        type: 'Website',
                        category: 'Website & Platform',
                        status: 'Published',
                        external_url: 'https://csi.bursamalaysia.com/app/signin',
                        image_url: "/assetsv2/banners/bursa.png",
                        isfrontendurl: true
                    },
                    {
                        id: '2',
                        title: 'JC3 Malaysia',
                        description: 'Joint Committee on Climate Change Malaysia - providing climate-related financial risk management guidance.',
                        type: 'Website',
                        category: 'Website & Platform',
                        status: 'Published',
                        external_url: 'https://www.jc3malaysia.com/',
                        image_url: "/assetsv2/banners/jc3.png",
                        isfrontendurl: true
                    },
                    {
                        id: '3',
                        title: 'ESG Hub Malaysia',
                        description: 'Comprehensive ESG assessment and reporting platform for Malaysian businesses.',
                        type: 'Assessment Tool',
                        category: 'Website & Platform',
                        status: 'Published',
                        external_url: 'https://www.esghub.my/assessment',
                        image_url: "/assetsv2/banners/smeesg.png",
                        isfrontendurl: true
                    },
                    {
                        id: '4',
                        title: 'SDG Centre EKKL',
                        description: 'Sustainable Development Goals Centre for East, West, and Central Asia - regional sustainability resources.',
                        type: 'Resource Hub',
                        category: 'Website & Platform',
                        status: 'Published',
                        external_url: 'https://sdgcentrekl.com/',
                        image_url: "/assetsv2/banners/sdg.png",
                        isfrontendurl: true
                    },
                    {
                        id: '5',
                        title: 'SDG Centre Malaysia',
                        description: 'Official Malaysian SDG Centre providing local sustainability development goals guidance and resources.',
                        type: 'Resource Hub',
                        category: 'Website & Platform',
                        status: 'Published',
                        external_url: 'https://www.sdgcentre.gov.my/ms/',
                        image_url: "/assetsv2/banners/sdg.png",
                        isfrontendurl: true
                    },
                    {
                        id: '6',
                        title: 'Climate Change and Principle-based Taxonomy (CCPT), 2021',
                        description: 'The CCPT (2021) is Bank Negara Malaysia\'s framework for classifying economic activities by their environmental and climate alignment.',
                        type: 'Framework',
                        category: 'Resources',
                        status: 'Published',
                        external_url: 'https://www.bnm.gov.my/documents/20124/938039/Climate+Change+and+Principle-based+Taxonomy.pdf',
                        image_url: '/assets/learning-materials/ccpt.png',
                        isfrontendurl: true
                    },
                    {
                        id: '7',
                        title: 'National Energy Transition Roadmap (NETR), 2023',
                        description: 'Malaysia\'s strategic blueprint to shift its energy system from fossil fuels toward low-carbon, renewable sources by 2050.',
                        type: 'Framework',
                        category: 'Resources',
                        status: 'Published',
                        external_url: 'https://ekonomi.gov.my/sites/default/files/2023-08/National%20Energy%20Transition%20Roadmap.pdf',
                        image_url: '/assets/learning-materials/netr.jpg',
                        isfrontendurl: true
                    },
                    {
                        id: '8',
                        title: 'New Industrial Master Plan 2030 (NIMP), 2023',
                        description: 'Malaysia\'s mission-based framework to transform the manufacturing sector through higher value creation, technology, and green growth.',
                        type: 'Framework',
                        category: 'Resources',
                        status: 'Published',
                        external_url: 'https://www.nimp2030.gov.my/',
                        image_url: '/assets/learning-materials/nimp.png',
                        isfrontendurl: true
                    },
                    {
                        id: '9',
                        title: 'National Sustainability Reporting Framework (NSRF), 2024',
                        description: 'Malaysia\'s framework to enhance corporate sustainability disclosures by adopting ISSB standards.',
                        type: 'Framework',
                        category: 'Resources',
                        status: 'Published',
                        external_url: 'https://www.sc.com.my/nsrf',
                        image_url: '/assets/learning-materials/nsrf.png',
                        isfrontendurl: true
                    },
                    {
                        id: '10',
                        title: 'National National Climate Change Policy 2.0, 2024',
                        description: 'An umbrella policy guiding Malaysia\'s transition to a low-carbon economy with clear pathways for governance, adaptation, climate financing and net-zero by 2050.',
                        type: 'Policy',
                        category: 'Resources',
                        status: 'Published',
                        external_url: 'https://www.nres.gov.my/ms-my/pustakamedia/Penerbitan/National%20Policy%20on%20Climate%20Change%202.0.pdf',
                        image_url: '/assets/learning-materials/nccp.png',
                        isfrontendurl: true
                    },
                    {
                        id: '11',
                        title: 'NATIONAL ENERGY POLICY 2022-2040',
                        description: 'Malaysia\'s long-term policy guiding the energy sector towards a low-carbon future, balancing energy security, affordability and environmental sustainability through 12 strategic thrusts and 31 action plans.',
                        type: 'Policy',
                        category: 'Resources',
                        status: 'Published',
                        external_url: 'https://ekonomi.gov.my/sites/default/files/2022-09/National_Energy_Policy_2022-2040.pdf',
                        image_url: '/assets/learning-materials/nep.jpg',
                        isfrontendurl: true
                    },
                    {
                        id: '12',
                        title: 'SIRIM 55 ESG Management System Certification',
                        description: 'A Malaysian certification standard that enables organisations to build, implement, maintain, and continually improve a management system for environmental, social, and governance (ESG) practices',
                        type: 'Certificates',
                        category: 'Certification',
                        status: 'Published',
                        external_url: 'https://www.sirim-qas.com.my/service/sirim-55-esg-management-system-certification/?utm',
                        image_url: '/assets/learning-materials/esg-sirim.jpg',
                        isfrontendurl: true
                    },
                    {
                        id: '13',
                        title: 'ISO 14001: Environmental Management Systems',
                        description: 'The ISO 14001 standard provides a framework for organizations to manage their environmental responsibilities through effective environmental management systems.',
                        type: 'Certificates',
                        category: 'Certification',
                        status: 'Published',
                        external_url: 'https://www.sirim-qas.com.my/service/iso-14001-environmental-management-system-ems/',
                        image_url: '/assets/learning-materials/iso-14001.png',
                        isfrontendurl: true
                    },
                    {
                        id: '14',
                        title: 'ISO 45001: Occupational Health and Safety Management Systems',
                        description: 'The ISO 45001 standard provides a framework for managing occupational health and safety risks to create safer and healthier workplaces.',
                        type: 'Certificates',
                        category: 'Certification',
                        status: 'Published',
                        external_url: 'https://www.sirim-qas.com.my/service/iso-45001-occupational-health-and-safety-ohs/',
                        image_url: '/assets/learning-materials/iso-45001.jpg',
                        isfrontendurl: true
                    },
                    {
                        id: '15',
                        title: 'MyHIJAU MARK',
                        description: 'The MyHIJAU Mark is Malaysia\'s official government-endorsed green label that certifies products and services meeting environmental standards, aiding consumer choices and green procurement.',
                        type: 'Certificates',
                        category: 'Certification',
                        status: 'Published',
                        external_url: 'https://www.myhijau.my/',
                        image_url: '/assets/learning-materials/my-hijau.png',
                        isfrontendurl: true
                    },
                    {
                        id: '16',
                        title: 'Low Carbon Transition Facility (LCTF)',
                        description: 'A financing facility by Bank Negara Malaysia that supports SMEs in adopting low-carbon practices and technologies.',
                        type: 'Incentives',
                        category: 'Financing & Incentives',
                        status: 'Published',
                        external_url: 'https://www.bnm.gov.my/documents/20124/6025157/lctf_broc_en.pdf',
                        image_url: '/assets/learning-materials/lctf.jpg',
                        isfrontendurl: true
                    },
                    {
                        id: '17',
                        title: 'Green Technology Financing Scheme (GTFS) 4.0',
                        description: 'A government financing initiative that supports companies in implementing green projects through guaranteed financing and interest rebates.',
                        type: 'Financing Initiative',
                        category: 'Financing & Incentives',
                        status: 'Published',
                        external_url: 'https://www.myhijau.my/gtfs?utm ',
                        image_url: '/assets/learning-materials/gtfs.png',
                        isfrontendurl: true
                    },
                    {
                        id: '18',
                        title: 'Investment and Foreign Investment Accelerator Fund (DIAF-ESG)',
                        description: 'A funding programme designed to support companies in accelerating ESG adoption and attracting quality investments.',
                        type: 'Fund',
                        category: 'Financing & Incentives',
                        status: 'Published',
                        external_url: 'https://www.mida.gov.my/wp-content/uploads/2024/04/DIAF-ESG-Guidelines-1.pdf',
                        image_url: '/assets/learning-materials/mida.png',
                        isfrontendurl: true
                    },
                    {
                        id: '19',
                        title: 'GreenBizReady by CIMB',
                        description: 'A programme that helps SMEs build climate resilience and adopt sustainable practices through assessments, training, and advisory support.',
                        type: 'Financial Initiative',
                        category: 'Financing & Incentives',
                        status: 'Published',
                        external_url: 'https://www.cimb.com.my/en/business/business-solutions/solutions/greenbizready.html',
                        image_url: '/assets/learning-materials/cimb-logo.png',
                        isfrontendurl: true
                    },
                    {
                        id: '20',
                        title: 'High Tech & Green Facility (HTG) by SME Bank',
                        description: 'A financing initiative that supports SMEs in adopting high technology and green practices to enhance competitiveness and sustainability.',
                        type: 'Financial Initiative',
                        category: 'Financing & Incentives',
                        status: 'Published',
                        external_url: 'https://www.smebank.com.my/ms/high-tech-green-facility-htg-',
                        image_url: "/assets/learning-materials/sme-bank.png",
                        isfrontendurl: true
                    }
                ];
                // Fetch dynamic sections and materials
                const [sectionsRes, materialsRes] = await Promise.all([
                    fetch(`${import.meta.env.VITE_APP_API}/learning-materials-sections/`),
                    fetch(`${import.meta.env.VITE_APP_API}/learning-materials/public/list`)
                ]);

                const dynamicSections = sectionsRes.ok ? await sectionsRes.json() : [];
                const dynamicMaterials = materialsRes.ok ? await materialsRes.json() : [];

                console.log("dynamicMaterials");
                console.log(dynamicSections);

                // Normalize helpers
                const normalize = (v) => (v || '').toString().trim().toLowerCase();
                const nameOf = (s) => normalize(s.category || s.title);

                // Merge sections (de-duplicate by category/title)
                const allSectionsMap = new Map();
                [...hardcodedSections, ...dynamicSections].forEach((section) => {
                    allSectionsMap.set(nameOf(section), section);
                });
                const allSections = Array.from(allSectionsMap.values());

                // Merge materials (de-duplicate by id or title)
                const allMaterialsMap = new Map();
                [...hardcodedMaterials, ...dynamicMaterials].forEach((material) => {
                    const key = material.id || material.title;
                    if (key && !allMaterialsMap.has(key)) {
                        allMaterialsMap.set(key, material);
                    }
                });
                const allMaterials = Array.from(allMaterialsMap.values());

                console.log("allMaterials");
                console.log(allMaterials);

                // Optional: Sort sections by standard order
                const standardOrder = [
                    'ESG & Sustainability',
                    'Website & Platform',
                    'Resources',
                    'Certification',
                    'Financing & Incentives',
                    'ESG Champion'
                ];

                const orderedSections = standardOrder
                    .map((label) =>
                        allSections.find((s) => nameOf(s) === normalize(label))
                    )
                    .filter(Boolean);
                console.log("orderedSections");
                console.log(orderedSections);

                // Fallback to allSections if ordering doesn't yield results
                //setSections(orderedSections.length ? orderedSections : allSections);
                setSections(allSections.filter(section => section.status === 'Published'));
                setMaterials(allMaterials);
            } catch (err) {
                console.error(err);
                setError('Failed to load learning materials.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Helper to resolve the correct image URL
    const getImageUrl = (m) => {
        if (!m.image_url) return null;

        // If already a full URL (e.g., starts with http/https)
        if (m.image_url.startsWith('http')) return m.image_url;

        // If flagged as a frontend asset
        if (m.isfrontendurl) return m.image_url;

        // Otherwise, assume it's hosted in backend's uploads folder
        return `${import.meta.env.VITE_APP_API}${m.image_url}`;
    };


    return (
        <div className="">
            {landing &&
                <div className="page-title-section" style={{ paddingTop: '0rem' }}>
                    <div className="container">
                        <div className="row">
                            <div className="col-12 text-center">
                                <h1 className="display-4 fw-bold">Learning Centre</h1>
                                <p className="lead">Comprehensive resources to help your business implement sustainable practices.</p>
                            </div>
                        </div>
                    </div>
                </div>
            }

            <div>
                {loading && (
                    <div className="text-center py-5 text-muted">Loading learning materials...</div>
                )}
                {error && (
                    <div className="alert alert-danger" role="alert">{error}</div>
                )}
                {!loading && !error && (
                    <>
                        {(() => {
                            const normalize = (v) => (v || '').toString().trim().toLowerCase();
                            const sectionList = selectedCategory
                                ? sections.filter((s) => normalize(s.category || s.title) === normalize(selectedCategory))
                                : sections;

                            if (sectionList.length === 0) {
                                return (
                                    <div className="pt-2"><Empty title="Oops! No sections to display." /></div>
                                );
                            }

                            return sectionList.map((section, idx) => {
                                const sectionKey = section.__displayTitle || section.category || section.title;
                                const sectionId = getSectionId(sectionKey);

                                if (normalize(sectionKey) === normalize('ESG & Sustainability')) {
                                    return (
                                        <section key={section.id} id={sectionId} className={`lm-snap-section ${idx % 2 === 1 ? 'lm-band-alt' : 'lm-band'}`}>
                                            <div className="container">
                                                <h4 className="text-center fw-bold mb-4">ESG &amp; Sustainability</h4>

                                                {/* WHAT IS ESG */}
                                                <div className="esg-blue-box mb-4">
                                                    <div className="esg-title">WHAT IS ESG?</div>
                                                    <p className="mb-3">ESG stands for Environmental, Social and Governance. It represents a holistic approach to assessing a company's commitment to sustainable practices, social responsibility and ethical governance. More than a rebranding of CSR, ESG demands transparency and manages financial risks associated with sustainability efforts.</p>
                                                    <p className="">ESG is commonly used by <strong>investors, regulators and stakeholders</strong> to assess a company's long‑term risk and sustainability practices.</p>
                                                </div>

                                                {/* E, S, G COLUMNS */}
                                                <div className="row g-3 mb-1">
                                                    <div className="col-md-4">
                                                        <div className="esg-green-box h-100">
                                                            <div className="esg-subtitle"><strong>Environmental</strong> – How a company impacts the planet.</div>
                                                            <ul className="esg-list">
                                                                <li>Emission Management (GHG Protocol; Scope 1, 2 &amp; 3)</li>
                                                                <li>Energy Management</li>
                                                                <li>Water Management</li>
                                                                <li>Waste Management</li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <div className="esg-green-box h-100">
                                                            <div className="esg-subtitle"><strong>Social</strong> – How a company manages relationships with people and society.</div>
                                                            <ul className="esg-list">
                                                                <li>Labour Practices &amp; Standards</li>
                                                                <li>Safety &amp; Health</li>
                                                                <li>Employee Benefits</li>
                                                                <li>Corporate Social Responsibility</li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <div className="esg-green-box h-100">
                                                            <div className="esg-subtitle"><strong>Governance</strong> – How a company is governed and structured.</div>
                                                            <ul className="esg-list">
                                                                <li>Culture &amp; Commitment</li>
                                                                <li>Integrity &amp; Anti‑corruption</li>
                                                                <li>Risk Governance &amp; Internal Controls</li>
                                                                <li>Decision Making &amp; Strategic Oversight</li>
                                                                <li>Disclosure, Transparency &amp; Data Protection</li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="esg-source-out">source: ESG Quick Guide for MSME</div>

                                                {/* WHAT IS SUSTAINABILITY */}
                                                <div className="esg-blue-box mb-4">
                                                    <div className="esg-title">WHAT IS SUSTAINABILITY?</div>
                                                    <p className="">Sustainability is a broader concept that refers to meeting the needs of the present without compromising the ability of future generations to meet their own needs.</p>
                                                    <div className="esg-cite">– <em>Brundtland Report, 1987</em></div>
                                                </div>

                                                {/* THREE PILLARS */}
                                                <div className="esg-blue-box narrow mb-4">
                                                    <div className="esg-title">It's often broken down into three pillars</div>
                                                </div>
                                                <div className="row g-3 mb-2">
                                                    <div className="col-md-4">
                                                        <div className="esg-green-box h-100">
                                                            <div className="esg-subtitle">Environmental Sustainability</div>
                                                            <ul className="esg-list">
                                                                <li>Protecting ecosystems</li>
                                                                <li>Reducing carbon emissions</li>
                                                                <li>Managing natural resources responsibly</li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <div className="esg-green-box h-100">
                                                            <div className="esg-subtitle">Social Sustainability</div>
                                                            <ul className="esg-list">
                                                                <li>Ensuring equitable access to resources and opportunities</li>
                                                                <li>Promoting social justice and well‑being</li>
                                                                <li>Maintaining cultural identity and community health</li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <div className="esg-green-box h-100">
                                                            <div className="esg-subtitle">Economic Sustainability</div>
                                                            <ul className="esg-list">
                                                                <li>Creating stable, inclusive and resilient economic systems</li>
                                                                <li>Supporting fair trade and ethical business practices</li>
                                                                <li>Long‑term financial planning and responsible growth</li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="esg-source-out">source : https://sdgs.un.org/2030agenda</div>

                                                {/* WHAT IS SDG */}
                                                <div className="esg-blue-box mb-3">
                                                    <div className="esg-title">What is SDG?</div>
                                                    <p className="">SDG stands for Sustainable Development Goals. They are 17 global goals set by the United Nations in 2015, as part of the 2030 Agenda for Sustainable Development.</p>
                                                </div>

                                                <div className="text-center mb-4">
                                                    <img src="/assets/learning-materials/sdg-goals.png" alt="SDG Goals" className="img-fluid" />
                                                    <div className="esg-source mt-1">source - Home - United Nations Sustainable Development</div>
                                                </div>

                                                {/* IN SHORT */}
                                                <div className="esg-inshort-visual mb-3">
                                                    <div className="esg-inshort-heading">IN SHORT…</div>
                                                    <img src="/assetsv2/carpks2.jpg" alt="carpks2" className="img-fluid w-100" />
                                                </div>

                                                <div className="esg-note">
                                                    <div className="esg-note-title">NOTE:</div>
                                                    <ul className="">
                                                        <li>Malaysia aims to reduce its economy‑wide greenhouse gas (GHG) emissions intensity against GDP by 45% by 2030, compared to 2005 levels.</li>
                                                        <li>Malaysian government has committed to achieving net‑zero GHG emissions by 2050.</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </section>
                                    );
                                }

                                const allSectionMaterials = materials.filter(
                                    (m) => normalize(m.category) === normalize(sectionKey)
                                );

                                const sectionMaterials = selectedCategory ? allSectionMaterials : allSectionMaterials.slice(0, 5);

                                return (
                                    <section key={section.id} id={sectionId} className={`lm-snap-section ${idx % 2 === 1 && landing ? 'lm-band-alt' : 'lm-band'}`}>
                                        <div className="container lm-section-block" style={{ background: 'transparent', border: 'none', padding: 0 }}>
                                            <div className="lm-section-header">
                                                <h4 className="lm-section-title ">{section.__displayTitle || section.title}</h4>
                                                {!selectedCategory && (
                                                    <a className="btn btn-sm btn-outline-primary"
                                                        href={`/learning-materials?category=${encodeURIComponent(sectionKey)}`}>
                                                        View more
                                                    </a>
                                                )}
                                            </div>
                                            <div className="row g-4">
                                                {sectionMaterials.map((m, materialIndex) => {
                                                    const isTransparent = false; // Update logic as needed
                                                    return (
                                                        <div key={m.id} className="col-lg-4 col-md-6">
                                                            <div className={`card h-100 p-0 border lm-material-card d-flex flex-column ${isTransparent ? 'opacity-50' : ''}`}>

                                                                {/* Optional debug output */}
                                                                {/* {JSON.stringify(m)} */}

                                                                {m.image_url ? (
                                                                    m.external_url ? (
                                                                        <a href={m.external_url} target="_blank" rel="noreferrer">
                                                                            <img
                                                                                src={getImageUrl(m)}
                                                                                className="card-img-top lm-thumb"
                                                                                alt={m.title}
                                                                                onError={(e) => {
                                                                                    console.log('Image failed to load:', m.image_url, e.target.src);
                                                                                    e.target.style.display = 'none';
                                                                                }}
                                                                            />
                                                                        </a>
                                                                    ) : (
                                                                        <img
                                                                            src={getImageUrl(m)}
                                                                            className="card-img-top lm-thumb"
                                                                            alt={m.title}
                                                                            onError={(e) => {
                                                                                console.log('Image failed to load:', m.image_url, e.target.src);
                                                                                e.target.style.display = 'none';
                                                                            }}
                                                                        />
                                                                    )
                                                                ) : (
                                                                    <div className="card-img-top lm-thumb d-flex align-items-center justify-content-center bg-light">
                                                                        <span className="text-muted">{m.title}</span>
                                                                    </div>
                                                                )}

                                                                <div className="card-body p-3 d-flex flex-column flex-grow-1">
                                                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                                                        {m.external_url ? (
                                                                            <a href={m.external_url} target="_blank" rel="noreferrer" className="text-decoration-none">
                                                                                <h5 className="card-title fw-bold text-primary">{m.title}</h5>
                                                                            </a>
                                                                        ) : (
                                                                            <h5 className="card-title fw-bold text-primary">{m.title}</h5>
                                                                        )}
                                                                        <span className={`badge lm-badge ${m.type === 'Article' ? 'bg-success' :
                                                                            m.type === 'Video' ? 'bg-warning' :
                                                                                'bg-info'
                                                                            } text-white`}>
                                                                            {m.type || 'Material'}
                                                                        </span>
                                                                    </div>

                                                                    <div className="flex-grow-1">
                                                                        <p className="card-text text-muted mb-3">{m.description}</p>
                                                                    </div>

                                                                    <div className="d-flex align-items-center mb-3">
                                                                        <i className="bi bi-tags me-1 text-primary"></i>
                                                                        <small className="text-muted lm-tag">{m.category || 'Uncategorized'}</small>
                                                                    </div>

                                                                    <div className="mt-auto">
                                                                        {m.external_url ? (
                                                                            <a className="btn w-100" href={m.external_url} target="_blank" rel="noreferrer">Read More</a>
                                                                        ) : (
                                                                            <a className="btn w-100" href={`/learning-materials/${m.id}`}>Read More</a>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                {/* {sectionMaterials.length === 0 && (
                                                    <div className="pt-2"><Empty title="Oops! No materials in this section yet." /></div>
                                                )} */}
                                            </div>
                                        </div>
                                    </section>
                                );
                            });
                        })()}
                    </>
                )}
            </div>
        </div>
    );
}

export default LearningMaterials;


