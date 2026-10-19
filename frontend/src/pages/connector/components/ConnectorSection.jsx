const ConnectorSection = ({ title, children }) => (
    <section className="w-full bg-white rounded-[24px] shadow-[0_3px_24px_#1A26641A] p-6 md:p-8">
        <h2 className="font-garet font-bold text-[22px]/[30px] text-purple mb-4">{title}</h2>
        {children}
    </section>
);

export default ConnectorSection;
