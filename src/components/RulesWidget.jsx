import React, { useEffect, useState } from "react";
import { Card, Badge, Spinner } from "react-bootstrap";
import { FileText } from "lucide-react";
import { getRules } from "../utils/Api";

const truncate = (str, n = 160) => {
  if (!str) return "";
  return str.length > n ? str.slice(0, n) + "..." : str;
};

const RulesWidget = ({ page = "payment_page", max = 5, compact = false }) => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        // getRules accepts a params object
        const resp = await getRules({ page });
        // API shape: { rules: [...] } or array
        const data = resp?.data;
        let list = [];
        if (!data) list = [];
        else if (Array.isArray(data)) list = data;
        else if (Array.isArray(data.rules)) list = data.rules;
        else if (Array.isArray(data.results)) list = data.results;
        else list = [];

        if (mounted) setRules((list || []).filter(r => r.is_active));
      } catch (err) {
        console.error("RulesWidget load error", err);
        if (mounted) setError(err?.message || "Failed to load rules");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [page]);

  return (
    <Card className={`shadow-sm ${compact ? 'p-2' : ''}`}>
      <Card.Body>
        <div className="d-flex align-items-center mb-2">
          <FileText size={18} className="me-2 text-primary" />
          <h6 className="mb-0">Rules</h6>
        </div>

        {loading ? (
          <div className="text-center py-3"><Spinner animation="border" size="sm" /></div>
        ) : error ? (
          <div className="text-danger small">{error}</div>
        ) : (rules && rules.length > 0) ? (
          <div className="d-flex flex-column gap-2">
            {rules.slice(0, max).map((r) => (
              <div key={r.id} className="border rounded-2 p-2 bg-white">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="fw-semibold">{r.title}</div>
                    <div className="small text-muted">{truncate(r.description, compact ? 80 : 160)}</div>
                  </div>
                  <div className="ms-2 text-end">
                    <Badge bg="info" className="small">{(r.rule_type || '').replace(/_/g, ' ')}</Badge>
                  </div>
                </div>
              </div>
            ))}
            {rules.length > max && (
              <div className="text-muted small">+{rules.length - max} more</div>
            )}
          </div>
        ) : (
          <div className="text-muted small">No rules configured for this page.</div>
        )}
      </Card.Body>
    </Card>
  );
};

export default RulesWidget;

