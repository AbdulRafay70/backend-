import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Form, Pagination, Alert, Breadcrumb } from 'react-bootstrap';
import { Heart, MessageCircle, Share2, ChevronRight, Search, Tag, Calendar, User, ArrowLeft } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/blog-page.css';

// Simplified header for public pages
const PublicHeader = () => (
  <header style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #dee2e6', padding: '1rem 0' }}>
    <Container>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0d6efd', textDecoration: 'none' }}>
          Saer.pk
        </a>
        <nav style={{ display: 'flex', gap: '2rem' }}>
          <a href="/" style={{ color: '#212529', textDecoration: 'none', fontSize: '0.95rem' }}>Home</a>
          <a href="/blogs/" style={{ color: '#0d6efd', textDecoration: 'none', fontSize: '0.95rem' }}>Blogs</a>
          <a href="#contact" style={{ color: '#212529', textDecoration: 'none', fontSize: '0.95rem' }}>Contact</a>
        </nav>
      </div>
    </Container>
  </header>
);

// Simplified footer for public pages
const PublicFooter = () => (
  <footer style={{ backgroundColor: '#212529', color: 'white', padding: '2rem 0', marginTop: 'auto' }}>
    <Container>
      <Row className="mb-4">
        <Col md={3} className="mb-3">
          <h6>About Saer.pk</h6>
          <p style={{ fontSize: '0.9rem' }}>Leading Umrah and travel services provider in Pakistan.</p>
        </Col>
        <Col md={3} className="mb-3">
          <h6>Quick Links</h6>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li><a href="/" style={{ color: '#adb5bd', textDecoration: 'none' }}>Home</a></li>
            <li><a href="/blogs/" style={{ color: '#adb5bd', textDecoration: 'none' }}>Blogs</a></li>
            <li><a href="/packages" style={{ color: '#adb5bd', textDecoration: 'none' }}>Packages</a></li>
          </ul>
        </Col>
        <Col md={3} className="mb-3">
          <h6>Contact</h6>
          <p style={{ fontSize: '0.9rem' }}>
            <a href="tel:+923161234567" style={{ color: '#adb5bd', textDecoration: 'none' }}>+92 316 1234567</a><br />
            <a href="mailto:info@saer.pk" style={{ color: '#adb5bd', textDecoration: 'none' }}>info@saer.pk</a>
          </p>
        </Col>
        <Col md={3} className="mb-3">
          <h6>Follow Us</h6>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <a href="#" style={{ color: '#adb5bd', textDecoration: 'none' }}>Facebook</a>
            <a href="#" style={{ color: '#adb5bd', textDecoration: 'none' }}>Twitter</a>
            <a href="#" style={{ color: '#adb5bd', textDecoration: 'none' }}>Instagram</a>
          </div>
        </Col>
      </Row>
      <hr style={{ borderColor: '#495057' }} />
      <p style={{ textAlign: 'center', marginBottom: 0, fontSize: '0.9rem', color: '#adb5bd' }}>
        &copy; 2025 Saer.pk - All rights reserved
      </p>
    </Container>
  </footer>
);

// Blog Page Router - handles /blogs/ and /blogs/:slug/
const BlogPageRouter = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  // Dummy blogs data
  const allBlogs = [
    {
      id: 1,
      title: 'Best Umrah Packages 2025',
      slug: 'best-umrah-packages-2025',
      short_description: 'Explore our most affordable and premium Umrah packages for 2025',
      cover_image: 'https://via.placeholder.com/1200x400?text=Umrah+2025',
      author: 'Admin',
      author_image: 'https://via.placeholder.com/50',
      status: 'published',
      tags: ['Umrah', 'Packages', '2025'],
      hashtags: ['#UmrahTips', '#Travel'],
      meta_title: 'Best Umrah Packages 2025 | Saer.pk',
      meta_description: 'Explore affordable Umrah packages with Saer.pk',
      views: 1250,
      likes: 87,
      liked: false,
      comments_count: 23,
      created_at: '2025-10-20',
      updated_at: '2025-10-25',
      page_url: '/blogs/best-umrah-packages-2025/',
      content: `
        <p>Performing Umrah is a spiritual journey that requires proper planning, attention to religious requirements, and choosing the right travel partner. Saer.pk brings you the most comprehensive Umrah packages for 2025, combining affordability with world-class services.</p>
        <h3>Why Choose Saer.pk for Umrah?</h3>
        <ul>
          <li>✓ Best price guarantee in Pakistan</li>
          <li>✓ IATA-certified travel agents</li>
          <li>✓ 24/7 on-ground support in Makkah and Madina</li>
          <li>✓ Flexible payment plans</li>
          <li>✓ Comfortable 4-5 star hotels</li>
        </ul>
        <h3>Our 2025 Package Options</h3>
        <p><strong>Premium Umrah (22 Days):</strong> SAR 95,000 - Includes direct flights, 5-star hotels, ziyarat tours</p>
        <p><strong>Standard Umrah (18 Days):</strong> SAR 75,000 - 4-star hotels, guided tours, visa assistance</p>
        <p><strong>Budget Umrah (15 Days):</strong> SAR 55,000 - 3-star hotels, group flights, basic support</p>
      `,
      sections: [
        {
          id: 101,
          title: 'Introduction to Umrah',
          subtitle: 'Spiritual Journey Begins',
          content: '<p>Performing Umrah is a spiritual journey...</p>',
          background_color: '#ffffff',
          font_color: '#222222',
          images: ['https://via.placeholder.com/400x300?text=Kaaba']
        },
        {
          id: 102,
          title: 'Package Details',
          subtitle: 'Choose Your Perfect Plan',
          content: '<p>We offer three tiers of packages...</p>',
          background_color: '#f8f9fa',
          font_color: '#222222'
        }
      ],
      comments: [
        {
          id: 1,
          name: 'Ahmed Hassan',
          email: 'ahmed@example.com',
          avatar: 'https://via.placeholder.com/40',
          comment: 'Amazing packages! Booked the premium package for my family.',
          date: '2025-10-24',
          likes: 12,
          replies: []
        },
        {
          id: 2,
          name: 'Fatima Khan',
          email: 'fatima@example.com',
          avatar: 'https://via.placeholder.com/40',
          comment: 'The support team was extremely helpful. Highly recommended!',
          date: '2025-10-23',
          likes: 8,
          replies: [
            {
              id: 11,
              name: 'Admin',
              avatar: 'https://via.placeholder.com/40',
              comment: 'Thank you for your feedback! We look forward to serving you again.',
              date: '2025-10-23',
              likes: 2
            }
          ]
        }
      ],
      related_blogs: [2, 3]
    },
    {
      id: 2,
      title: 'Umrah Visa Guide 2025',
      slug: 'umrah-visa-guide-2025',
      short_description: 'Complete guide to obtaining Umrah visa for Pakistani nationals',
      cover_image: 'https://via.placeholder.com/1200x400?text=Visa+Guide',
      author: 'Admin',
      author_image: 'https://via.placeholder.com/50',
      status: 'published',
      tags: ['Visa', 'Guide', 'Documentation'],
      hashtags: ['#VisaGuide', '#Umrah'],
      meta_title: 'Umrah Visa Guide 2025 | Saer.pk',
      meta_description: 'Complete Umrah visa documentation guide for Pakistan',
      views: 892,
      likes: 56,
      liked: false,
      comments_count: 12,
      created_at: '2025-10-18',
      updated_at: '2025-10-20',
      page_url: '/blogs/umrah-visa-guide-2025/',
      content: `
        <p>The Umrah visa (Visa for Umrah) is a pilgrimage visa issued by Saudi Arabia specifically for Muslims performing Umrah. Here's a complete guide for Pakistani nationals.</p>
        <h3>Required Documents</h3>
        <ul>
          <li>Valid passport (minimum 6 months validity)</li>
          <li>Completed visa application form</li>
          <li>4x6 passport-size photograph</li>
          <li>Bank statement showing financial stability</li>
          <li>Employment letter or business registration</li>
        </ul>
      `,
      sections: [],
      comments: [],
      related_blogs: [1, 3]
    },
    {
      id: 3,
      title: 'Top Ziyarat Sites in Makkah',
      slug: 'top-ziyarat-sites-makkah',
      short_description: 'Must-visit religious sites and historical places in Makkah',
      cover_image: 'https://via.placeholder.com/1200x400?text=Ziyarat+Sites',
      author: 'Admin',
      author_image: 'https://via.placeholder.com/50',
      status: 'published',
      tags: ['Ziyarat', 'Makkah', 'Religious'],
      hashtags: ['#Ziyarat', '#IslamicSites'],
      meta_title: 'Top Ziyarat Sites in Makkah | Saer.pk',
      meta_description: 'Guide to most important ziyarat sites in Makkah',
      views: 1500,
      likes: 125,
      liked: false,
      comments_count: 45,
      created_at: '2025-11-01',
      updated_at: '2025-11-01',
      page_url: '/blogs/top-ziyarat-sites-makkah/',
      content: `
        <p>Makkah is home to numerous sacred and historical Islamic sites. Here are the top ziyarats you must visit during your Umrah journey.</p>
        <h3>1. Al-Haram Mosque (Grand Mosque)</h3>
        <p>The most sacred mosque in Islam, housing the Kaaba.</p>
        <h3>2. Jabal Al-Noor (Mountain of Light)</h3>
        <p>The cave where Prophet Muhammad received the first revelation.</p>
      `,
      sections: [],
      comments: [],
      related_blogs: [1, 2]
    }
  ];

  // Show blog listing page if no slug provided
  if (!slug) {
    return <BlogListingPage blogs={allBlogs} />;
  }

  // Show individual blog page if slug provided
  const blog = allBlogs.find(b => b.slug === slug);
  if (!blog) {
    return (
      <div className="d-flex flex-column min-vh-100">
        <Container fluid className="flex-grow-1 py-5">
          <Alert variant="danger">Blog not found: {slug}</Alert>
        </Container>
      </div>
    );
  }

  return <BlogDetailPage blog={blog} allBlogs={allBlogs} />;
};

// Blog Listing Page Component
const BlogListingPage = ({ blogs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const blogsPerPage = 6;

  const publishedBlogs = blogs.filter(b => b.status === 'published');
  
  let filtered = publishedBlogs;
  if (searchTerm) {
    filtered = filtered.filter(b => 
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.short_description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  if (selectedTag) {
    filtered = filtered.filter(b => b.tags.includes(selectedTag));
  }

  const totalPages = Math.ceil(filtered.length / blogsPerPage);
  const start = (currentPage - 1) * blogsPerPage;
  const paginatedBlogs = filtered.slice(start, start + blogsPerPage);

  const allTags = [...new Set(publishedBlogs.flatMap(b => b.tags))];

  return (
    <div className="d-flex flex-column min-vh-100">
      <PublicHeader />
      
      <div className="blogs-listing py-5">
        <Container>
          {/* Breadcrumb */}
          <Breadcrumb className="mb-4">
            <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
            <Breadcrumb.Item active>Blogs</Breadcrumb.Item>
          </Breadcrumb>

          {/* Hero Section */}
          <Row className="mb-5">
            <Col lg={8}>
              <h1 className="mb-2">Saer.pk Blog Community</h1>
              <p className="text-muted">Discover insights, tips, and guides about Umrah, travel, and more</p>
            </Col>
            <Col lg={4}>
              <Form.Group>
                <Form.Control
                  placeholder="Search blogs..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="search-input"
                />
              </Form.Group>
            </Col>
          </Row>

          {/* Tag Filters */}
          <Row className="mb-4">
            <Col>
              <div className="tag-filters">
                <Button
                  variant={!selectedTag ? 'primary' : 'outline-secondary'}
                  size="sm"
                  onClick={() => {
                    setSelectedTag('');
                    setCurrentPage(1);
                  }}
                  className="me-2 mb-2"
                >
                  All Blogs ({filtered.length})
                </Button>
                {allTags.map(tag => (
                  <Button
                    key={tag}
                    variant={selectedTag === tag ? 'primary' : 'outline-secondary'}
                    size="sm"
                    onClick={() => {
                      setSelectedTag(tag);
                      setCurrentPage(1);
                    }}
                    className="me-2 mb-2"
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </Col>
          </Row>

          {/* Blogs Grid */}
          {paginatedBlogs.length > 0 ? (
            <>
              <Row className="mb-4">
                {paginatedBlogs.map(blog => (
                  <Col lg={4} md={6} key={blog.id} className="mb-4">
                    <Card className="blog-list-card h-100 shadow-sm">
                      <Card.Img
                        variant="top"
                        src={blog.cover_image}
                        style={{ height: '200px', objectFit: 'cover' }}
                      />
                      <Card.Body className="d-flex flex-column">
                        <div className="mb-2">
                          {blog.tags.slice(0, 2).map(tag => (
                            <Badge key={tag} bg="info" className="me-1">{tag}</Badge>
                          ))}
                        </div>
                        <Card.Title className="mb-2">{blog.title}</Card.Title>
                        <Card.Text className="text-muted flex-grow-1">
                          {blog.short_description}
                        </Card.Text>
                        <hr />
                        <div className="blog-meta mb-3">
                          <small>
                            <Calendar size={14} className="me-1" />
                            {new Date(blog.created_at).toLocaleDateString()}
                          </small>
                          <small className="ms-3">
                            <MessageCircle size={14} className="me-1" />
                            {blog.comments_count} comments
                          </small>
                        </div>
                        <a href={`/blogs/${blog.slug}/`} className="btn btn-outline-primary btn-sm w-100">
                          Read More
                          <ChevronRight size={16} className="ms-1" />
                        </a>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>

              {/* Pagination */}
              {totalPages > 1 && (
                <Row className="mb-4">
                  <Col className="d-flex justify-content-center">
                    <Pagination>
                      <Pagination.First
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                      />
                      <Pagination.Prev
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      />
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <Pagination.Item
                          key={i + 1}
                          active={i + 1 === currentPage}
                          onClick={() => setCurrentPage(i + 1)}
                        >
                          {i + 1}
                        </Pagination.Item>
                      ))}
                      <Pagination.Next
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      />
                      <Pagination.Last
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                      />
                    </Pagination>
                  </Col>
                </Row>
              )}
            </>
          ) : (
            <Alert variant="info">No blogs found matching your criteria</Alert>
          )}
        </Container>
      </div>

      <PublicFooter />
    </div>
  );
};

// Blog Detail Page Component
const BlogDetailPage = ({ blog, allBlogs }) => {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(blog.liked);
  const [newComment, setNewComment] = useState({ name: '', email: '', comment: '' });
  const [comments, setComments] = useState(blog.comments || []);

  const handleLike = () => {
    setLiked(!liked);
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (newComment.name && newComment.email && newComment.comment) {
      const comment = {
        id: Math.max(...comments.map(c => c.id), 0) + 1,
        ...newComment,
        avatar: 'https://via.placeholder.com/40',
        date: new Date().toISOString().split('T')[0],
        likes: 0,
        replies: []
      };
      setComments([...comments, comment]);
      setNewComment({ name: '', email: '', comment: '' });
    }
  };

  const relatedBlogs = allBlogs.filter(b => 
    b.status === 'published' &&
    b.slug !== blog.slug &&
    b.tags.some(tag => blog.tags.includes(tag))
  ).slice(0, 3);

  return (
    <div className="d-flex flex-column min-vh-100">
      <PublicHeader />

      <div className="blog-detail py-5">
        <Container>
          {/* Breadcrumb */}
          <Breadcrumb className="mb-4">
            <Breadcrumb.Item onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
              Home
            </Breadcrumb.Item>
            <Breadcrumb.Item onClick={() => navigate('/blogs/')} style={{ cursor: 'pointer' }}>
              Blogs
            </Breadcrumb.Item>
            <Breadcrumb.Item active>{blog.title}</Breadcrumb.Item>
          </Breadcrumb>

          {/* Hero Image */}
          <div className="blog-hero mb-5" style={{
            backgroundImage: `url(${blog.cover_image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            height: '400px',
            borderRadius: '12px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.5) 100%)'
            }} />
          </div>

          <Row>
            <Col lg={8}>
              {/* Blog Header */}
              <div className="blog-header mb-4">
                <h1 className="mb-3">{blog.title}</h1>
                
                <div className="blog-meta mb-3 pb-3 border-bottom">
                  <div className="d-flex align-items-center mb-2">
                    <img src={blog.author_image} alt={blog.author} style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      marginRight: '15px'
                    }} />
                    <div>
                      <p className="mb-0"><strong>{blog.author}</strong></p>
                      <small className="text-muted">Published on {new Date(blog.created_at).toLocaleDateString()}</small>
                    </div>
                  </div>
                  <div className="mt-3">
                    <small className="text-muted me-3">
                      <i className="bi bi-eye me-1"></i> {blog.views} views
                    </small>
                    <small className="text-muted me-3">
                      <MessageCircle size={14} className="me-1" style={{ display: 'inline' }} />
                      {comments.length} comments
                    </small>
                  </div>
                </div>

                {/* Tags */}
                <div className="blog-tags mb-4">
                  {blog.tags.map(tag => (
                    <Badge key={tag} bg="info" className="me-2 mb-2">{tag}</Badge>
                  ))}
                  {blog.hashtags.map(tag => (
                    <Badge key={tag} bg="secondary" className="me-2 mb-2">{tag}</Badge>
                  ))}
                </div>
              </div>

              {/* Blog Content */}
              <div className="blog-content mb-5">
                <div dangerouslySetInnerHTML={{ __html: blog.content }} />
              </div>

              {/* Sections */}
              {blog.sections.length > 0 && (
                <div className="blog-sections mb-5">
                  {blog.sections.map((section, idx) => (
                    <Card key={section.id} className="mb-3" style={{
                      borderLeft: '4px solid #0d6efd',
                      backgroundColor: section.background_color
                    }}>
                      <Card.Body>
                        <Card.Title>{section.title}</Card.Title>
                        {section.subtitle && <Card.Subtitle className="mb-3">{section.subtitle}</Card.Subtitle>}
                        <div dangerouslySetInnerHTML={{ __html: section.content }} />
                        {section.images && section.images.length > 0 && (
                          <div className="mt-3">
                            {section.images.map((img, i) => (
                              <img key={i} src={img} alt="Section" style={{ maxWidth: '100%', borderRadius: '8px', marginTop: '10px' }} />
                            ))}
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="blog-actions mb-4 d-flex gap-3">
                <Button
                  variant={liked ? 'primary' : 'outline-primary'}
                  onClick={handleLike}
                  className="d-flex align-items-center"
                >
                  <Heart size={18} className={`me-2 ${liked ? 'fill-white' : ''}`} />
                  {liked ? 'Liked' : 'Like'} ({blog.likes + (liked ? 1 : 0)})
                </Button>
                <Button
                  variant="outline-primary"
                  onClick={() => navigator.clipboard.writeText(window.location.href)}
                  className="d-flex align-items-center"
                >
                  <Share2 size={18} className="me-2" />
                  Share
                </Button>
              </div>

              {/* Comments Section */}
              <div className="comments-section mb-5">
                <h5 className="mb-4">Comments ({comments.length})</h5>

                {/* Comment Form */}
                <Card className="mb-4 bg-light">
                  <Card.Body>
                    <h6 className="mb-3">Leave a Comment</h6>
                    <Form onSubmit={handleCommentSubmit}>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Name</Form.Label>
                            <Form.Control
                              type="text"
                              value={newComment.name}
                              onChange={(e) => setNewComment({ ...newComment, name: e.target.value })}
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                              type="email"
                              value={newComment.email}
                              onChange={(e) => setNewComment({ ...newComment, email: e.target.value })}
                              required
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      <Form.Group className="mb-3">
                        <Form.Label>Comment</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={newComment.comment}
                          onChange={(e) => setNewComment({ ...newComment, comment: e.target.value })}
                          required
                        />
                      </Form.Group>
                      <Button type="submit" variant="primary">
                        Post Comment
                      </Button>
                    </Form>
                  </Card.Body>
                </Card>

                {/* Comments List */}
                {comments.map(comment => (
                  <div key={comment.id} className="comment mb-3">
                    <div className="d-flex mb-2">
                      <img src={comment.avatar} alt={comment.name} style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        marginRight: '15px'
                      }} />
                      <div className="flex-grow-1">
                        <strong>{comment.name}</strong>
                        <br />
                        <small className="text-muted">{comment.date}</small>
                      </div>
                    </div>
                    <p className="ms-5">{comment.comment}</p>
                  </div>
                ))}
              </div>
            </Col>

            {/* Sidebar */}
            <Col lg={4}>
              {/* Related Blogs */}
              {relatedBlogs.length > 0 && (
                <Card className="mb-4 shadow-sm">
                  <Card.Header>
                    <Card.Title className="mb-0">Related Blogs</Card.Title>
                  </Card.Header>
                  <Card.Body className="p-0">
                    {relatedBlogs.map(relatedBlog => (
                      <a key={relatedBlog.id} href={`/blogs/${relatedBlog.slug}/`} className="related-blog-item">
                        <img src={relatedBlog.cover_image} alt={relatedBlog.title} style={{
                          width: '60px',
                          height: '60px',
                          objectFit: 'cover',
                          borderRadius: '4px',
                          marginRight: '15px'
                        }} />
                        <div>
                          <p className="mb-1">{relatedBlog.title}</p>
                          <small className="text-muted">{relatedBlog.comments_count} comments</small>
                        </div>
                      </a>
                    ))}
                  </Card.Body>
                </Card>
              )}

              {/* Newsletter */}
              <Card className="mb-4 shadow-sm bg-primary text-white">
                <Card.Body>
                  <Card.Title>Subscribe for Updates</Card.Title>
                  <p className="small">Get our latest blog posts and travel tips delivered to your inbox.</p>
                  <Form>
                    <Form.Group className="mb-2">
                      <Form.Control type="email" placeholder="Your email" size="sm" />
                    </Form.Group>
                    <Button variant="light" size="sm" className="w-100">
                      Subscribe
                    </Button>
                  </Form>
                </Card.Body>
              </Card>

              {/* Blog Stats */}
              <Card className="shadow-sm">
                <Card.Body>
                  <h6 className="mb-3">Blog Statistics</h6>
                  <div className="stat-item mb-3">
                    <small className="text-muted">Total Views</small>
                    <p className="mb-0"><strong>{blog.views}</strong></p>
                  </div>
                  <div className="stat-item mb-3">
                    <small className="text-muted">Total Likes</small>
                    <p className="mb-0"><strong>{blog.likes + (liked ? 1 : 0)}</strong></p>
                  </div>
                  <div className="stat-item">
                    <small className="text-muted">Total Comments</small>
                    <p className="mb-0"><strong>{comments.length}</strong></p>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      <PublicFooter />
    </div>
  );
};

export default BlogPageRouter;
