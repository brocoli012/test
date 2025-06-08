const Card = ({ title, children, id }) => (
  <section id={id} className="bg-white rounded-xl shadow p-6 mb-6">
    {title && <div className="font-bold text-lg mb-2">{title}</div>}
    {children}
  </section>
);
export default Card; 