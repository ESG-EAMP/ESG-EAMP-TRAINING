import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Title from '../../layouts/Title/Title';
import { FaPlus, FaEdit, FaTrashAlt, FaEye, FaSearch, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import Swal from 'sweetalert2';
import api from '../../utils/api';
import { hasPermission, Permission } from '../../utils/permissions';

function ManageEvents() {
	const [events, setEvents] = useState([]);
	const [searchTerm, setSearchTerm] = useState('');
	const [filterStatus, setFilterStatus] = useState('');
	const navigate = useNavigate();

	// Pagination state
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(5);

	useEffect(() => {
		fetchEvents();
	}, []);

	// Reset pagination when filters or search change
	useEffect(() => {
		setCurrentPage(1);
	}, [searchTerm, filterStatus]);

	const fetchEvents = async () => {
		try {
			const res = await api.get('/events/');
			const data = res.data;
			setEvents(Array.isArray(data) ? data : []);
		} catch (error) {
			console.error("Error fetching events:", error);
			setEvents([]);
			if (error.response?.status !== 403) {
				Swal.fire({
					icon: 'error',
					title: 'Error',
					text: 'Failed to fetch events.'
				});
			}
		}
	};

	const handleDelete = async (id) => {
		// Check permission before allowing delete
		if (!hasPermission(Permission.DELETE_CONTENT)) {
			Swal.fire({
				title: 'Permission Denied',
				text: 'You do not have permission to delete events.',
				icon: 'error',
				confirmButtonColor: '#3085d6'
			});
			return;
		}

		const result = await Swal.fire({
			title: 'Are you sure?',
			text: "Are you sure you want to delete this event?",
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#3085d6',
			confirmButtonText: 'Yes, delete it!',
			cancelButtonText: 'Cancel'
		});

		if (!result.isConfirmed) return;

		try {
			await api.delete(`/events/${id}`);
			Swal.fire({
				icon: 'success',
				title: 'Deleted!',
				text: 'Event has been deleted.',
				timer: 1500,
				showConfirmButton: false
			});
			fetchEvents();
		} catch (error) {
			console.error(error);
			Swal.fire({
				icon: 'error',
				title: 'Error',
				text: 'Delete failed.'
			});
		}
	};

	const getStatusBadge = (status) => {
		const badges = {
			'Published': 'badge bg-success',
			'Draft': 'badge bg-warning text-dark',
			'Archived': 'badge bg-secondary',
			'Upcoming': 'badge bg-info',
			'Ongoing': 'badge bg-primary',
			'Completed': 'badge bg-secondary'
		};
		return <span className={badges[status] || 'badge bg-light text-dark'}>{status}</span>;
	};

	const filteredEvents = (events || []).filter(event => {
		const matchesSearch = event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			event.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			event.description?.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesStatus = !filterStatus || event.status === filterStatus;
		return matchesSearch && matchesStatus;
	}).sort((a, b) => (a.order || 0) - (b.order || 0));

	// Get unique statuses for filter dropdown
	const uniqueStatuses = [...new Set((events || []).map(event => event.status).filter(Boolean))].sort();

	// Pagination logic
	const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const currentEvents = filteredEvents.slice(startIndex, endIndex);

	// Pagination handlers
	const handlePageChange = (page) => {
		setCurrentPage(page);
	};

	const handleItemsPerPageChange = (newItemsPerPage) => {
		setItemsPerPage(newItemsPerPage);
		setCurrentPage(1);
	};

	// Handle move event up
	const handleMoveUpEvent = async (eventId, displayIndex) => {
		const sortedEvents = [...filteredEvents];
		const eventIndex = sortedEvents.findIndex(e => e.id === eventId);

		if (eventIndex === 0) return; // Already at top

		const event = sortedEvents[eventIndex];
		const prevEvent = sortedEvents[eventIndex - 1];

		// Swap orders
		const tempOrder = event.order || eventIndex;
		const newOrder = prevEvent.order || (eventIndex - 1);

		try {
			// Update both events using FormData (since events use FormData for updates)
			const formData1 = new FormData();
			formData1.append('title', event.title);
			formData1.append('description', event.description || '');
			formData1.append('date', new Date(event.date).toISOString());
			formData1.append('location', event.location || '');
			formData1.append('category', event.category || '');
			formData1.append('status', event.status || 'Upcoming');
			formData1.append('external_url', event.external_url || '');
			formData1.append('order', newOrder);

			const formData2 = new FormData();
			formData2.append('title', prevEvent.title);
			formData2.append('description', prevEvent.description || '');
			formData2.append('date', new Date(prevEvent.date).toISOString());
			formData2.append('location', prevEvent.location || '');
			formData2.append('category', prevEvent.category || '');
			formData2.append('status', prevEvent.status || 'Upcoming');
			formData2.append('external_url', prevEvent.external_url || '');
			formData2.append('order', tempOrder);

			await Promise.all([
				api.put(`/events/${event.id}`, formData1, {
					headers: { 'Content-Type': 'multipart/form-data' }
				}),
				api.put(`/events/${prevEvent.id}`, formData2, {
					headers: { 'Content-Type': 'multipart/form-data' }
				})
			]);

			fetchEvents();
		} catch (error) {
			console.error('Move event error:', error);
			Swal.fire({
				icon: 'error',
				title: 'Error',
				text: 'Failed to move event.'
			});
		}
	};

	// Handle move event down
	const handleMoveDownEvent = async (eventId, displayIndex) => {
		const sortedEvents = [...filteredEvents];
		const eventIndex = sortedEvents.findIndex(e => e.id === eventId);

		if (eventIndex === sortedEvents.length - 1) return; // Already at bottom

		const event = sortedEvents[eventIndex];
		const nextEvent = sortedEvents[eventIndex + 1];

		// Swap orders
		const tempOrder = event.order || eventIndex;
		const newOrder = nextEvent.order || (eventIndex + 1);

		try {
			// Update both events using FormData (since events use FormData for updates)
			const formData1 = new FormData();
			formData1.append('title', event.title);
			formData1.append('description', event.description || '');
			formData1.append('date', new Date(event.date).toISOString());
			formData1.append('location', event.location || '');
			formData1.append('category', event.category || '');
			formData1.append('status', event.status || 'Upcoming');
			formData1.append('external_url', event.external_url || '');
			formData1.append('order', newOrder);

			const formData2 = new FormData();
			formData2.append('title', nextEvent.title);
			formData2.append('description', nextEvent.description || '');
			formData2.append('date', new Date(nextEvent.date).toISOString());
			formData2.append('location', nextEvent.location || '');
			formData2.append('category', nextEvent.category || '');
			formData2.append('status', nextEvent.status || 'Upcoming');
			formData2.append('external_url', nextEvent.external_url || '');
			formData2.append('order', tempOrder);

			await Promise.all([
				api.put(`/events/${event.id}`, formData1, {
					headers: { 'Content-Type': 'multipart/form-data' }
				}),
				api.put(`/events/${nextEvent.id}`, formData2, {
					headers: { 'Content-Type': 'multipart/form-data' }
				})
			]);

			fetchEvents();
		} catch (error) {
			console.error('Move event error:', error);
			Swal.fire({
				icon: 'error',
				title: 'Error',
				text: 'Failed to move event.'
			});
		}
	};

	return (
		<div className="container-fluid">
			<Title title="Manage Events" breadcrumb={[["Events", "/admin/events"], "Manage"]} />
			<div className="d-flex justify-content-between align-items-center mb-3">
				<div></div>
				<button
					className="btn btn-primary"
					onClick={() => navigate('/admin/events/new')}
				>
					<FaPlus className="me-1" /> Add Event
				</button>
			</div>
			{/* Items Per Page - Top Right */}
			<div className="row mb-3">
				<div className="col-12">
					<div className="d-flex justify-content-end align-items-center gap-2">
						<label className="form-label text-muted">Show:</label>
						<select
							className="form-select form-select-sm"
							style={{ width: 'auto' }}
							value={itemsPerPage}
							onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
						>
							{[10, 20, 30, 40, 50].map(size => (
								<option key={size} value={size}>
									{size}
								</option>
							))}
						</select>
						<span className="text-muted">entries</span>
					</div>
				</div>
			</div>



			{/* Search and Filter */}
			<div className="row align-items-center mb-3">
				<div className="col-md-4">
					<div className="input-group">
						<span className="input-group-text bg-light border-end-0">
							<FaSearch className="text-muted" />
						</span>
						<input
							type="text"
							className="form-control border-start-0"
							placeholder="Search events..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>
				</div>
				<div className="col-md-3">
					<select
						className="form-select"
						value={filterStatus}
						onChange={(e) => setFilterStatus(e.target.value)}
					>
						<option value="">All Statuses</option>
						{uniqueStatuses.map(status => (
							<option key={status} value={status}>{status}</option>
						))}
					</select>
				</div>
			</div>

			<div className="mb-3">
				<h5 className="fw-semibold">Events ({filteredEvents.length})</h5>
			</div>

			<div className=" table-scroll-top overflow-y-auto card">
				<table className="table  table-hover ">
					<thead className="table-dark">
						<tr>
							<th>No.</th>
							<th>Actions</th>
							<th>Title</th>
							<th>Date</th>
							<th>Status</th>
							<th>Location</th>
							<th>Order</th>
						</tr>
					</thead>
					<tbody>
						{currentEvents.map((event, index) => (
							<tr key={event.id}>
								<td>
									<span className="text-muted">{startIndex + index + 1}</span>
								</td>
								<td>
									{hasPermission(Permission.DELETE_CONTENT) && (
										<button
											className="btn btn-sm text-danger"
											onClick={() => handleDelete(event.id)}
											title="Delete Event"
										>
											<FaTrashAlt />
										</button>
									)}
									<button
										className="btn btn-sm me-1"
										onClick={() => navigate(`/admin/events/preview/${event.id}`)}
									>
										<FaEye />
									</button>
									<button
										className="btn btn-sm me-1"
										onClick={() => navigate(`/admin/events/edit/${event.id}`)}
									>
										<FaEdit />
									</button>
								</td>
								<td>
									<div>
										<h6 className="mb-1 fw-semibold">{event.title}</h6>
										{event.description && (
											<small className="text-muted">{event.description}</small>
										)}
									</div>
								</td>
								<td>{event.date ? new Date(event.date).toLocaleDateString() : 'N/A'}</td>
								<td>{getStatusBadge(event.status)}</td>
								<td>{event.location || 'N/A'}</td>
								<td>
									<div className="d-flex align-items-center gap-2">
										<span className="badge bg-light text-dark">{event.order || 0}</span>
										<div className="btn-group btn-group-sm">
											<button
												className="btn btn-outline-secondary"
												onClick={() => handleMoveUpEvent(event.id, startIndex + index)}
												disabled={startIndex + index === 0}
												title="Move Up"
											>
												<FaArrowUp />
											</button>
											<button
												className="btn btn-outline-secondary"
												onClick={() => handleMoveDownEvent(event.id, startIndex + index)}
												disabled={startIndex + index === filteredEvents.length - 1}
												title="Move Down"
											>
												<FaArrowDown />
											</button>
										</div>
									</div>
								</td>
							</tr>
						))}
						{currentEvents.length === 0 && (
							<tr>
								<td colSpan="7" className="text-center py-5">
									No events found.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>


			{/* Pagination - Bottom Center */}
			{totalPages > 1 && (
				<div className="row mt-4">
					<div className="col-12">
						<nav aria-label="Events pagination">
							<ul className="pagination justify-content-center">
								<li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
									<button
										className="page-link"
										onClick={() => handlePageChange(currentPage - 1)}
										disabled={currentPage === 1}
									>
										<i className="fas fa-chevron-left"></i>
									</button>
								</li>

								{Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
									let pageNum;
									if (totalPages <= 5) {
										pageNum = i + 1;
									} else if (currentPage <= 3) {
										pageNum = i + 1;
									} else if (currentPage >= totalPages - 2) {
										pageNum = totalPages - 4 + i;
									} else {
										pageNum = currentPage - 2 + i;
									}

									return (
										<li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
											<button
												className="page-link"
												onClick={() => handlePageChange(pageNum)}
											>
												{pageNum}
											</button>
										</li>
									);
								})}

								<li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
									<button
										className="page-link"
										onClick={() => handlePageChange(currentPage + 1)}
										disabled={currentPage === totalPages}
									>
										<i className="fas fa-chevron-right"></i>
									</button>
								</li>
							</ul>
						</nav>
					</div>
				</div>
			)}
		</div>
	);
}

export default ManageEvents;
