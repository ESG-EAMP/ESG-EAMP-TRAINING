import React, { useEffect, useState } from 'react';
import {
	FiArrowRight,
} from 'react-icons/fi';

import { LearningMaterials as PublicLearningMaterials, LearningMaterialDetail, ContactUs, Events, EventPreview } from '../Landing';
import { ImSection } from 'react-icons/im';

const LandingContent = () => {
	const [aboutPage, setAboutPage] = useState(null);
	const [pkslestariPage, setPkslestariPage] = useState(null);
	const [loadingPages, setLoadingPages] = useState(true);

	// Helper to check if HTML content is empty or mostly blank
	const isContentEmpty = (htmlContent) => {
		if (!htmlContent || typeof htmlContent !== 'string') return true;
		
		const tempDiv = document.createElement('div');
		tempDiv.innerHTML = htmlContent;
		const textContent = tempDiv.textContent || tempDiv.innerText || '';
		const trimmedText = textContent.trim().replace(/\s+/g, ' ');
		
		return trimmedText.length < 3;
	};

	// Fetch About and PKSlestari pages
	useEffect(() => {
		const fetchPages = async () => {
			try {
				const [aboutRes, pkslestariRes] = await Promise.all([
					fetch(`${import.meta.env.VITE_APP_API}/static-pages/about`),
					fetch(`${import.meta.env.VITE_APP_API}/static-pages/pkslestari`)
				]);

				const aboutData = aboutRes.ok ? await aboutRes.json() : null;
				const pkslestariData = pkslestariRes.ok ? await pkslestariRes.json() : null;

				setAboutPage(aboutData);
				setPkslestariPage(pkslestariData);
			} catch (err) {
				console.error('Error fetching static pages:', err);
			} finally {
				setLoadingPages(false);
			}
		};
		fetchPages();
	}, []);
	// Scroll to section if hash is present
	useEffect(() => {
		const scrollToSection = (sectionId) => {
			const element = document.getElementById(sectionId);
			if (element) {
				// Small delay to ensure DOM is ready (especially after content loads)
				setTimeout(() => {
					const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
					const viewportHeight = window.innerHeight;
					// Scroll to 5% from top of viewport
					const scrollPosition = elementTop - (viewportHeight * 0.05);
					window.scrollTo({
						top: Math.max(0, scrollPosition),
						behavior: 'smooth'
					});
				}, 100);
			}
		};

		const handleHashChange = () => {
			const hash = window.location.hash.substring(1); // Remove the #
			if (hash === 'about' || hash === 'pkslestari') {
				scrollToSection(hash);
			}
		};

		// Check on mount and after content loads
		if (!loadingPages) {
			handleHashChange();
		}

		// Listen for hash changes
		window.addEventListener('hashchange', handleHashChange);

		return () => {
			window.removeEventListener('hashchange', handleHashChange);
		};
	}, [loadingPages]);

	// Intersection Observer setup
	useEffect(() => {
		const observer = new IntersectionObserver((entries) => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					entry.target.classList.add('visible');
				}
			});
		}, {
			threshold: 0.1,
			rootMargin: '0px 0px -50px 0px'
		});

		// Observe all elements with animation classes
		const animatedElements = document.querySelectorAll(
			'.fade-in, .slide-in-left, .slide-in-right, .scale-in, .service-card, .card-pricing, .faq-question'
		);

		animatedElements.forEach(el => observer.observe(el));

		return () => {
			animatedElements.forEach(el => observer.unobserve(el));
		};
	}, []);

	return (
		<main>
			{/* START HERO */}
			<section className="hero-section d-flex align-items-center" style={{ height: '100vh' }}>
				<div className="container">
					<div className="row align-items-center">
						<div className="col-md-5">
							<div className="mt-md-4 fade-in text-center">
								<h1 className="text-white mb-4 mt-3 text-nowrap text-bold" style={{ fontSize: '2.5rem' }}>
									PLATFORM
								</h1>
								<img src="/assets/pks-lestari-sme-corp.png" alt="PKSlestari SME Corp" className="img-fluid" />

								<h3 className="text-white mb-4 mt-3 text-nowrap">
									Education | Assessment | Monitoring
								</h3>
								<a
									href="/assessment"
									target="_blank"
									className="btn font-16 rounded-pill text-white"
									style={{ backgroundColor: '#9528E6'}}
								>
									Start Assessment <FiArrowRight className="ms-1" />
								</a>
							</div>
						</div>
						<div className="col-md-5 offset-md-2">
							<div className="text-md-end mt-3 mt-md-0 slide-in-right">
								<img
									src="/assetsv2/landing-image2.svg"
									alt=""
									className="img-fluid"
								/>
							</div>
						</div>
					</div>
				</div>
			</section>
			{/* END HERO */}

			{/* ABOUT */}
			<section id="about" className="py-2 bg-transparent">
				<div className="container">
					{loadingPages ? (
						<div className="text-center py-3">
							<div className="spinner-border text-primary" role="status">
								<span className="visually-hidden">Loading...</span>
							</div>
						</div>
					) : aboutPage && aboutPage.content && !isContentEmpty(aboutPage.content) ? (
						<>
							<h2 className="text-white fw-bold mb-3">{aboutPage.title || 'ABOUT'}</h2>
							<div 
								className="about-content"
								style={{ lineHeight: 1.8 }}
								dangerouslySetInnerHTML={{ __html: aboutPage.content }}
							/>
						</>
					) : null}
				</div>
			</section>

			{/* PKSlestari Section */}
			<section id="pkslestari" className="py-2">
				<div className="container">
					{loadingPages ? (
						<div className="text-center py-3">
							<div className="spinner-border text-primary" role="status">
								<span className="visually-hidden">Loading...</span>
							</div>
						</div>
					) : pkslestariPage && pkslestariPage.content && !isContentEmpty(pkslestariPage.content) ? (
						<>
							<div 
								className="pkslestari-content"
								style={{ lineHeight: 1.8 }}
								dangerouslySetInnerHTML={{ __html: pkslestariPage.content }}
							/>
						</>
					) : null}
				</div>
			</section>

			<section>
				<PublicLearningMaterials landing={true} />
			</section>

			<section>
				<Events landing={true} />
			</section>

		</main>
	);
};

export default LandingContent; 