import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import useRealtimeAudit from '../lib/useRealtimeAudit';

export default function Auditoria() {
  const events = useRealtimeAudit();

  return (
    <ProtectedRoute>
      <Layout>

        <div style={styles.container}>

          <h1 style={styles.title}>📊 Auditoria em Tempo Real</h1>

          <div style={styles.feed}>
            {events.map((e, index) => (
              <div key={index} style={styles.card}>

                <div style={styles.row}>
                  <span style={styles.action}>{e.action}</span>
                  <span style={styles.table}>{e.table_name}</span>
                </div>

                <p style={styles.desc}>{e.old_data?.title || e.new_data?.title || 'Alteração registrada'}</p>

                <div style={styles.meta}>
                  <span>User: {e.user_id}</span>
                  <span>{new Date(e.created_at).toLocaleString()}</span>
                </div>

              </div>
            ))}
          </div>

        </div>

      </Layout>
    </ProtectedRoute>
  );
}

const styles = {
  container: {
    padding: 20,
    color: '#fff'
  },

  title: {
    color: '#f5c400',
    marginBottom: 20
  },

  feed: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },

  card: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: 10,
    padding: 15
  },

  row: {
    display: 'flex',
    justifyContent: 'space-between'
  },

  action: {
    color: '#f5c400',
    fontWeight: 'bold'
  },

  table: {
    color: '#888',
    fontSize: 12
  },

  desc: {
    marginTop: 8,
    color: '#ddd'
  },

  meta: {
    marginTop: 10,
    fontSize: 11,
    color: '#777',
    display: 'flex',
    justifyContent: 'space-between'
  }
};
