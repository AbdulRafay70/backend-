import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, Badge, Modal, Alert, Nav, Tab } from 'react-bootstrap';
import { Plus, Edit2, Trash2, Eye, Search, Filter, Calendar, User, Tag, BookOpen, Settings, Layers } from 'lucide-react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import '../../styles/blog-management.css';

const BlogManagement = () => {
  // Active Tab
  const [activeTab, setActiveTab] = useState('list');

  // Blogs State
  const [blogs, setBlogs] = useState([
    {
      id: 1,
      title: 'Best Umrah Packages 2025',
      slug: 'best-umrah-packages-2025',
      short_description: 'Explore our most affordable and premium Umrah packages for 2025',
      cover_image: 'https://via.placeholder.com/600x400?text=Umrah+2025',
      author_id: 1,
      author_name: 'Admin',
      status: 'published',
      tags: ['Umrah', 'Packages', '2025'],
      hashtags: ['#UmrahTips', '#Travel'],
      meta_title: 'Best Umrah Packages 2025 | Saer.pk',
      meta_description: 'Explore affordable Umrah packages with Saer.pk',
      views: 1250,
      likes: 87,
      comments: 23,
      created_at: '2025-10-20',
      updated_at: '2025-10-25',
      page_url: '/blogs/best-umrah-packages-2025/',
      sections: [
        {
          id: 101,
          title: 'Part 1 – Introduction',
          subtitle: 'Preparing for Umrah',
          content: '<p>Performing Umrah is a spiritual journey that requires proper planning...</p>',
          background_color: '#ffffff',
          font_color: '#222222',
          font_family: 'Poppins',
          font_size: '16px',
          images: [{ url: 'https://via.placeholder.com/400x300', position: 'left', caption: 'Kaaba View' }],
          order: 1
        },
        {
          id: 102,
          title: 'Part 2 – Our Packages',
          subtitle: 'Premium Options Available',
          content: '<p>We offer three tiers of Umrah packages...</p>',
          background_color: '#f8f9fa',
          font_color: '#222222',
          font_family: 'Poppins',
          font_size: '16px',
          order: 2
        }
      ]
    },
    {
      id: 2,
      title: 'Umrah Visa Guide 2025',
      slug: 'umrah-visa-guide-2025',
      short_description: 'Complete guide to obtaining Umrah visa for Pakistani nationals',
      cover_image: 'https://via.placeholder.com/600x400?text=Visa+Guide',
      author_id: 1,
      author_name: 'Admin',
      status: 'published',
      tags: ['Visa', 'Guide', 'Documentation'],
      hashtags: ['#VisaGuide', '#Umrah'],
      meta_title: 'Umrah Visa Guide 2025 | Saer.pk',
      meta_description: 'Complete Umrah visa documentation guide for Pakistan',
      views: 892,
      likes: 56,
      comments: 12,
      created_at: '2025-10-18',
      updated_at: '2025-10-20',
      page_url: '/blogs/umrah-visa-guide-2025/',
      sections: [
        {
          id: 201,
          title: 'Visa Requirements',
          subtitle: 'What You Need',
          content: '<p>To apply for Umrah visa, you need...</p>',
          background_color: '#ffffff',
          order: 1
        }
      ]
    },
    {
      id: 3,
      title: 'Top Ziyarat Sites in Makkah',
      slug: 'top-ziyarat-sites-makkah',
      short_description: 'Must-visit religious sites and historical places in Makkah',
      cover_image: 'https://via.placeholder.com/600x400?text=Ziyarat+Sites',
      author_id: 1,
      author_name: 'Admin',
      status: 'draft',
      tags: ['Ziyarat', 'Makkah', 'Religious'],
      hashtags: ['#Ziyarat', '#IslamicSites'],
      meta_title: 'Top Ziyarat Sites in Makkah | Saer.pk',
      meta_description: 'Guide to most important ziyarat sites in Makkah',
      views: 0,
      likes: 0,
      comments: 0,
      created_at: '2025-11-02',
      updated_at: '2025-11-02',
      page_url: '/blogs/top-ziyarat-sites-makkah/',
      sections: []
    }
  ]);

  // Form State
  const [blogForm, setBlogForm] = useState({
    title: '',
    short_description: '',
    tags: '',
    hashtags: '',
    meta_title: '',
    meta_description: '',
    cover_image: '',
  });

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    tag: ''
  });

  // Alert State
  const [alert, setAlert] = useState(null);

  // Statistics Component
  const StatsCard = ({ icon: Icon, title, value, color, subtitle }) => (
    <Card className={`stats-card stats-${color}`}>
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <small className="text-muted">{title}</small>
            <h4 className="mb-1">{value}</h4>
            {subtitle && <small className="text-secondary">{subtitle}</small>}
          </div>
          <Icon size={32} className={`text-${color}`} />
        </div>
      </Card.Body>
    </Card>
  );

  // Show Alert
  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  // Get Status Badge
  const getStatusBadge = (status) => {
    const badges = {
      published: { bg: 'success', label: 'Published ✓' },
      draft: { bg: 'warning', label: 'Draft' },
      archived: { bg: 'danger', label: 'Archived' }
    };
    return badges[status] || { bg: 'secondary', label: status };
  };

  // Auto-generate slug
  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .replace(/^-+|-+$/g, '');
  };

  // Auto-generate page URL
  const generatePageUrl = (slug) => {
    return `/blogs/${slug}/`;
  };

  // Handle Add Blog
  const handleAddBlog = () => {
    setSelectedBlog(null);
    setBlogForm({
      title: '',
      short_description: '',
      tags: '',
      hashtags: '',
      meta_title: '',
      meta_description: '',
      cover_image: '',
    });
    setShowAddModal(true);
  };

  // Handle Save Blog
  const handleSaveBlog = () => {
    if (!blogForm.title || !blogForm.short_description) {
      showAlert('danger', 'Please fill all required fields');
      return;
    }

    const slug = generateSlug(blogForm.title);
    const pageUrl = generatePageUrl(slug);

    if (selectedBlog) {
      // Update existing blog
      setBlogs(blogs.map(b => 
        b.id === selectedBlog.id 
          ? {
              ...b,
              ...blogForm,
              slug,
              page_url: pageUrl,
              updated_at: new Date().toISOString().split('T')[0]
            }
          : b
      ));
      showAlert('success', `Blog updated successfully. Page URL: ${pageUrl}`);
    } else {
      // Create new blog
      const newBlog = {
        id: Math.max(...blogs.map(b => b.id), 0) + 1,
        ...blogForm,
        slug,
        page_url: pageUrl,
        author_id: 1,
        author_name: 'Admin',
        status: 'draft',
        tags: blogForm.tags.split(',').map(t => t.trim()).filter(t => t),
        hashtags: blogForm.hashtags.split(',').map(h => h.trim()).filter(h => h),
        views: 0,
        likes: 0,
        comments: 0,
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
        sections: []
      };
      setBlogs([...blogs, newBlog]);
      showAlert('success', `Blog created successfully. Auto page created: ${pageUrl}`);
    }
    setShowAddModal(false);
    setShowEditModal(false);
  };

  // Handle Edit Blog
  const handleEditBlog = (blog) => {
    setSelectedBlog(blog);
    setBlogForm({
      title: blog.title,
      short_description: blog.short_description,
      tags: blog.tags.join(', '),
      hashtags: blog.hashtags.join(', '),
      meta_title: blog.meta_title,
      meta_description: blog.meta_description,
      cover_image: blog.cover_image,
    });
    setShowEditModal(true);
  };

  // Handle Delete Blog
  const handleDeleteBlog = (id) => {
    if (window.confirm('Are you sure you want to delete this blog? The associated page will be marked inactive.')) {
      setBlogs(blogs.filter(b => b.id !== id));
      showAlert('success', 'Blog deleted and page marked inactive');
    }
  };

  // Handle View Blog
  const handleViewBlog = (blog) => {
    setSelectedBlog(blog);
    setShowViewModal(true);
  };

  // Handle Open Builder
  const handleOpenBuilder = (blog) => {
    setSelectedBlog(blog);
    setShowBuilderModal(true);
  };

  // Change Blog Status
  const handleChangeStatus = (id, newStatus) => {
    setBlogs(blogs.map(b => 
      b.id === id 
        ? { ...b, status: newStatus, updated_at: new Date().toISOString().split('T')[0] }
        : b
    ));
    showAlert('success', `Blog status changed to ${newStatus}`);
  };

  // Filtered Blogs
  const filteredBlogs = blogs.filter(b => {
    if (filters.status && b.status !== filters.status) return false;
    if (filters.search && !b.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.tag && !b.tags.includes(filters.tag)) return false;
    return true;
  });

  // Calculate statistics
  const stats = {
    total_blogs: blogs.length,
    published: blogs.filter(b => b.status === 'published').length,
    draft: blogs.filter(b => b.status === 'draft').length,
    total_views: blogs.reduce((sum, b) => sum + b.views, 0)
  };

  return (
    <div className="d-flex">
      <Sidebar />
      <Container fluid className="p-0">
        <Header title="Blog Management" />
        
        <div className="blog-management py-4 px-4">
          {alert && (
            <Alert variant={alert.type} onClose={() => setAlert(null)} dismissible className="mb-4">
              {alert.message}
            </Alert>
          )}

          {/* Header */}
          <Row className="mb-4">
            <Col>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h2 className="mb-1">Blog Management System</h2>
                  <p className="text-muted mb-0">Create, edit, and manage blog posts with auto page generation</p>
                </div>
                <Button variant="primary" size="sm" onClick={handleAddBlog}>
                  <Plus size={18} className="me-2" />
                  New Blog
                </Button>
              </div>
            </Col>
          </Row>

          {/* Navigation Tabs */}
          <Row className="mb-4">
            <Col>
              <div className="blog-tabs">
                <button
                  className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
                  onClick={() => setActiveTab('list')}
                >
                  <BookOpen size={18} className="me-2" />
                  All Blogs
                </button>
                <button
                  className={`tab-btn ${activeTab === 'published' ? 'active' : ''}`}
                  onClick={() => setActiveTab('published')}
                >
                  <Eye size={18} className="me-2" />
                  Published
                </button>
                <button
                  className={`tab-btn ${activeTab === 'pages' ? 'active' : ''}`}
                  onClick={() => setActiveTab('pages')}
                >
                  <Layers size={18} className="me-2" />
                  Auto Pages
                </button>
              </div>
            </Col>
          </Row>

          {/* ==================== LIST TAB ==================== */}
          {activeTab === 'list' && (
            <>
              {/* Stats */}
              <Row className="mb-4">
                <Col lg={3} md={6} className="mb-3">
                  <StatsCard icon={BookOpen} title="Total Blogs" value={stats.total_blogs} color="primary" />
                </Col>
                <Col lg={3} md={6} className="mb-3">
                  <StatsCard icon={Eye} title="Published" value={stats.published} color="success" />
                </Col>
                <Col lg={3} md={6} className="mb-3">
                  <StatsCard icon={Tag} title="Drafts" value={stats.draft} color="warning" />
                </Col>
                <Col lg={3} md={6} className="mb-3">
                  <StatsCard icon={Calendar} title="Total Views" value={stats.total_views.toLocaleString()} color="info" />
                </Col>
              </Row>

              {/* Filters */}
              <Card className="blog-card mb-4">
                <Card.Header>
                  <Card.Title className="mb-0">Filters</Card.Title>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={3} className="mb-3">
                      <Form.Group>
                        <Form.Label>Status</Form.Label>
                        <Form.Select
                          value={filters.status}
                          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                          size="sm"
                        >
                          <option value="">All Status</option>
                          <option value="published">Published</option>
                          <option value="draft">Draft</option>
                          <option value="archived">Archived</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={4} className="mb-3">
                      <Form.Group>
                        <Form.Label>Search Blog</Form.Label>
                        <Form.Control
                          type="text"
                          value={filters.search}
                          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                          placeholder="Search blog title..."
                          size="sm"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3} className="mb-3">
                      <Form.Group>
                        <Form.Label>Tag</Form.Label>
                        <Form.Select
                          value={filters.tag}
                          onChange={(e) => setFilters({ ...filters, tag: e.target.value })}
                          size="sm"
                        >
                          <option value="">All Tags</option>
                          {[...new Set(blogs.flatMap(b => b.tags))].map(tag => (
                            <option key={tag} value={tag}>{tag}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={2} className="mb-3">
                      <Form.Group>
                        <Form.Label>&nbsp;</Form.Label>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => setFilters({ status: '', search: '', tag: '' })}
                          className="w-100"
                        >
                          Clear
                        </Button>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Blogs Table */}
              <Card className="blog-card">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <Card.Title className="mb-0">Blog Posts</Card.Title>
                </Card.Header>
                <Card.Body className="p-0">
                  <Table hover responsive className="mb-0">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Slug / URL</th>
                        <th>Author</th>
                        <th>Status</th>
                        <th>Tags</th>
                        <th>Views</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBlogs.map(blog => (
                        <tr key={blog.id}>
                          <td>
                            <strong>{blog.title}</strong>
                            <br />
                            <small className="text-muted">{blog.short_description.substring(0, 50)}...</small>
                          </td>
                          <td>
                            <code className="text-primary">{blog.slug}</code>
                            <br />
                            <small className="text-muted">{blog.page_url}</small>
                          </td>
                          <td>{blog.author_name}</td>
                          <td>
                            <Badge bg={getStatusBadge(blog.status).bg}>
                              {getStatusBadge(blog.status).label}
                            </Badge>
                          </td>
                          <td>
                            {blog.tags.slice(0, 2).map(tag => (
                              <Badge key={tag} bg="info" className="me-1">{tag}</Badge>
                            ))}
                            {blog.tags.length > 2 && <Badge bg="secondary">+{blog.tags.length - 2}</Badge>}
                          </td>
                          <td>
                            <span className="badge bg-light text-dark">{blog.views} views</span>
                            <br />
                            <small>{blog.likes} likes</small>
                          </td>
                          <td><small>{blog.created_at}</small></td>
                          <td>
                            <div className="action-buttons">
                              <Button variant="outline-info" size="sm" onClick={() => handleViewBlog(blog)} title="View">
                                <Eye size={16} />
                              </Button>
                              <Button variant="outline-primary" size="sm" onClick={() => handleEditBlog(blog)} title="Edit">
                                <Edit2 size={16} />
                              </Button>
                              <Button variant="outline-warning" size="sm" onClick={() => handleOpenBuilder(blog)} title="Builder">
                                <Settings size={16} />
                              </Button>
                              <Button variant="outline-danger" size="sm" onClick={() => handleDeleteBlog(blog.id)} title="Delete">
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </>
          )}

          {/* ==================== PUBLISHED TAB ==================== */}
          {activeTab === 'published' && (
            <Card className="blog-card">
              <Card.Header>
                <Card.Title className="mb-0">Published Blogs ({blogs.filter(b => b.status === 'published').length})</Card.Title>
              </Card.Header>
              <Card.Body>
                {blogs.filter(b => b.status === 'published').length > 0 ? (
                  <Row>
                    {blogs.filter(b => b.status === 'published').map(blog => (
                      <Col md={6} lg={4} key={blog.id} className="mb-4">
                        <Card className="blog-card h-100">
                          <Card.Img variant="top" src={blog.cover_image} style={{ height: '150px', objectFit: 'cover' }} />
                          <Card.Body>
                            <Card.Title className="fs-6">{blog.title}</Card.Title>
                            <p className="text-muted small">{blog.short_description}</p>
                            <div className="mb-2">
                              {blog.tags.slice(0, 2).map(tag => (
                                <Badge key={tag} bg="info" className="me-1">{tag}</Badge>
                              ))}
                            </div>
                            <small className="text-secondary">
                              📊 {blog.views} views | 👍 {blog.likes} likes
                            </small>
                            <div className="mt-3">
                              <Button size="sm" variant="outline-primary" className="me-2" onClick={() => handleViewBlog(blog)}>
                                View
                              </Button>
                              <Button size="sm" variant="outline-secondary" onClick={() => handleEditBlog(blog)}>
                                Edit
                              </Button>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <p className="text-muted text-center py-5">No published blogs yet</p>
                )}
              </Card.Body>
            </Card>
          )}

          {/* ==================== PAGES TAB ==================== */}
          {activeTab === 'pages' && (
            <Card className="blog-card">
              <Card.Header>
                <Card.Title className="mb-0">Auto-Generated Blog Pages ({blogs.length})</Card.Title>
              </Card.Header>
              <Card.Body className="p-0">
                <Table hover responsive className="mb-0">
                  <thead>
                    <tr>
                      <th>Blog Title</th>
                      <th>Page URL</th>
                      <th>Slug</th>
                      <th>Page Status</th>
                      <th>Meta Title</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blogs.map(blog => (
                      <tr key={blog.id}>
                        <td><strong>{blog.title}</strong></td>
                        <td>
                          <code className="text-success">{blog.page_url}</code>
                        </td>
                        <td><code>{blog.slug}</code></td>
                        <td>
                          <Badge bg={blog.status === 'archived' ? 'danger' : 'success'}>
                            {blog.status === 'archived' ? 'Inactive' : 'Active'}
                          </Badge>
                        </td>
                        <td><small>{blog.meta_title}</small></td>
                        <td>
                          <Button size="sm" variant="outline-primary" href={blog.page_url} target="_blank">
                            Visit Page
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}

          {/* ==================== MODALS ==================== */}

          {/* Add Blog Modal */}
          <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>Create New Blog</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Blog Title *</Form.Label>
                  <Form.Control
                    type="text"
                    value={blogForm.title}
                    onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })}
                    placeholder="e.g., Best Umrah Packages 2025"
                  />
                  {blogForm.title && (
                    <small className="text-muted mt-2 d-block">
                      Auto Slug: <code>{generateSlug(blogForm.title)}</code>
                      <br />
                      Auto URL: <code>{generatePageUrl(generateSlug(blogForm.title))}</code>
                    </small>
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Short Description *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={blogForm.short_description}
                    onChange={(e) => setBlogForm({ ...blogForm, short_description: e.target.value })}
                    placeholder="Brief description of the blog post"
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tags (comma-separated)</Form.Label>
                      <Form.Control
                        type="text"
                        value={blogForm.tags}
                        onChange={(e) => setBlogForm({ ...blogForm, tags: e.target.value })}
                        placeholder="Umrah, Packages, Travel"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Hashtags (comma-separated)</Form.Label>
                      <Form.Control
                        type="text"
                        value={blogForm.hashtags}
                        onChange={(e) => setBlogForm({ ...blogForm, hashtags: e.target.value })}
                        placeholder="#UmrahTips, #Travel"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Meta Title (SEO)</Form.Label>
                  <Form.Control
                    type="text"
                    value={blogForm.meta_title}
                    onChange={(e) => setBlogForm({ ...blogForm, meta_title: e.target.value })}
                    placeholder="SEO title for search engines"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Meta Description (SEO)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={blogForm.meta_description}
                    onChange={(e) => setBlogForm({ ...blogForm, meta_description: e.target.value })}
                    placeholder="SEO description for search engines"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Cover Image URL</Form.Label>
                  <Form.Control
                    type="text"
                    value={blogForm.cover_image}
                    onChange={(e) => setBlogForm({ ...blogForm, cover_image: e.target.value })}
                    placeholder="https://..."
                  />
                </Form.Group>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveBlog}>
                Create Blog (Auto Page Generated)
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Edit Blog Modal */}
          <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>Edit Blog</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Blog Title *</Form.Label>
                  <Form.Control
                    type="text"
                    value={blogForm.title}
                    onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })}
                    placeholder="e.g., Best Umrah Packages 2025"
                  />
                  {blogForm.title && (
                    <small className="text-muted mt-2 d-block">
                      New Auto Slug: <code>{generateSlug(blogForm.title)}</code>
                      <br />
                      New Auto URL: <code>{generatePageUrl(generateSlug(blogForm.title))}</code>
                    </small>
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Short Description *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={blogForm.short_description}
                    onChange={(e) => setBlogForm({ ...blogForm, short_description: e.target.value })}
                    placeholder="Brief description of the blog post"
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tags (comma-separated)</Form.Label>
                      <Form.Control
                        type="text"
                        value={blogForm.tags}
                        onChange={(e) => setBlogForm({ ...blogForm, tags: e.target.value })}
                        placeholder="Umrah, Packages, Travel"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Hashtags (comma-separated)</Form.Label>
                      <Form.Control
                        type="text"
                        value={blogForm.hashtags}
                        onChange={(e) => setBlogForm({ ...blogForm, hashtags: e.target.value })}
                        placeholder="#UmrahTips, #Travel"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Meta Title (SEO)</Form.Label>
                  <Form.Control
                    type="text"
                    value={blogForm.meta_title}
                    onChange={(e) => setBlogForm({ ...blogForm, meta_title: e.target.value })}
                    placeholder="SEO title for search engines"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Meta Description (SEO)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={blogForm.meta_description}
                    onChange={(e) => setBlogForm({ ...blogForm, meta_description: e.target.value })}
                    placeholder="SEO description for search engines"
                  />
                </Form.Group>

                {selectedBlog && (
                  <Form.Group className="mb-3">
                    <Form.Label>Blog Status</Form.Label>
                    <div>
                      {['draft', 'published', 'archived'].map(status => (
                        <Form.Check
                          key={status}
                          type="radio"
                          label={status.charAt(0).toUpperCase() + status.slice(1)}
                          name="status"
                          value={status}
                          checked={selectedBlog.status === status}
                          onChange={(e) => {
                            handleChangeStatus(selectedBlog.id, e.target.value);
                            setSelectedBlog({ ...selectedBlog, status: e.target.value });
                          }}
                        />
                      ))}
                    </div>
                  </Form.Group>
                )}
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveBlog}>
                Update Blog (Page Auto-Updated)
              </Button>
            </Modal.Footer>
          </Modal>

          {/* View Blog Modal */}
          <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>Blog Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {selectedBlog && (
                <div>
                  <div className="mb-3">
                    <img src={selectedBlog.cover_image} alt={selectedBlog.title} style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '8px' }} />
                  </div>
                  <h5>{selectedBlog.title}</h5>
                  <p className="text-muted">{selectedBlog.short_description}</p>
                  
                  <hr />
                  
                  <Row className="mb-3">
                    <Col md={6}>
                      <h6 className="mb-2">Metadata</h6>
                      <p><strong>Author:</strong> {selectedBlog.author_name}</p>
                      <p><strong>Status:</strong> <Badge bg={getStatusBadge(selectedBlog.status).bg}>{getStatusBadge(selectedBlog.status).label}</Badge></p>
                      <p><strong>Created:</strong> {selectedBlog.created_at}</p>
                      <p><strong>Updated:</strong> {selectedBlog.updated_at}</p>
                    </Col>
                    <Col md={6}>
                      <h6 className="mb-2">Statistics</h6>
                      <p><strong>Views:</strong> {selectedBlog.views}</p>
                      <p><strong>Likes:</strong> {selectedBlog.likes}</p>
                      <p><strong>Comments:</strong> {selectedBlog.comments}</p>
                      <p><strong>Sections:</strong> {selectedBlog.sections.length}</p>
                    </Col>
                  </Row>

                  <hr />

                  <Row className="mb-3">
                    <Col md={6}>
                      <h6 className="mb-2">Page Information</h6>
                      <p><strong>Slug:</strong> <code>{selectedBlog.slug}</code></p>
                      <p><strong>Page URL:</strong> <code className="text-success">{selectedBlog.page_url}</code></p>
                    </Col>
                    <Col md={6}>
                      <h6 className="mb-2">SEO</h6>
                      <p><strong>Meta Title:</strong> {selectedBlog.meta_title}</p>
                      <p><strong>Meta Desc:</strong> {selectedBlog.meta_description}</p>
                    </Col>
                  </Row>

                  <hr />

                  <h6 className="mb-2">Tags & Hashtags</h6>
                  <div className="mb-3">
                    {selectedBlog.tags.map(tag => (
                      <Badge key={tag} bg="info" className="me-2">{tag}</Badge>
                    ))}
                  </div>
                  <div>
                    {selectedBlog.hashtags.map(tag => (
                      <Badge key={tag} bg="secondary" className="me-2">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </Modal.Body>
          </Modal>

          {/* Blog Builder Modal */}
          <Modal show={showBuilderModal} onHide={() => setShowBuilderModal(false)} size="xl">
            <Modal.Header closeButton>
              <Modal.Title>Blog Page Builder</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {selectedBlog && (
                <div>
                  <h6 className="mb-3">Building: {selectedBlog.title}</h6>
                  
                  <Nav tabs>
                    <Nav.Item>
                      <Nav.Link active>Sections</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link>Styling</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link>Preview</Nav.Link>
                    </Nav.Item>
                  </Nav>

                  <div className="mt-3">
                    <h6 className="mb-2">Blog Sections ({selectedBlog.sections.length})</h6>
                    
                    {selectedBlog.sections.length > 0 ? (
                      selectedBlog.sections.map((section, idx) => (
                        <Card key={section.id} className="mb-2">
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <h6 className="mb-1">Section {idx + 1}: {section.title}</h6>
                                <p className="text-muted small mb-0">{section.subtitle}</p>
                              </div>
                              <Badge bg="primary">{section.order}</Badge>
                            </div>
                            <div className="mt-2" style={{ padding: '10px', backgroundColor: section.background_color, borderRadius: '4px', minHeight: '80px' }}>
                              <small style={{ color: section.font_color }}>{section.content.replace(/<[^>]*>/g, '').substring(0, 100)}...</small>
                            </div>
                          </Card.Body>
                        </Card>
                      ))
                    ) : (
                      <p className="text-muted text-center py-4">No sections yet. Click "Add Section" to begin building.</p>
                    )}

                    <Button variant="outline-primary" size="sm" className="mt-2">
                      <Plus size={16} className="me-2" />
                      Add Section
                    </Button>
                  </div>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowBuilderModal(false)}>
                Close
              </Button>
              <Button variant="primary" onClick={() => {
                showAlert('success', 'Blog page saved successfully!');
                setShowBuilderModal(false);
              }}>
                Save Page
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      </Container>
    </div>
  );
};

export default BlogManagement;
