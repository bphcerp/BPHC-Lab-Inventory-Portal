
const HelpPage = () => {
  const team = [
    {
      name: 'Naman Goyal',
      email: 'f20213136@hyderabad.bits-pilani.ac.in',
      phone: '7020118486',
    },
    {
      name: 'Silla Nakul',
      email: 'f20221322@hyderabad.bits-pilani.ac.in',
      phone: '8249354928',
    },
  ];

  return (
    <div className="container mx-auto p-4 min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-3xl">
        <h1 className="text-3xl font-semibold text-center text-gray-800 mb-6">Help & Support</h1>
        <p className="text-center text-gray-600 mb-3">
          Current Version: v1.1
        </p>
        <p className="text-center text-gray-600 mb-8">
          Last Updated On: 23/02/2025
        </p>
        <p className="text-center text-gray-600 mb-8">
          Reach out to us for assistance or any inquiries. We’re here to help!
        </p>

        <div className="space-y-6">
          {team.map((member, index) => (
            <div
              key={index}
              className="p-4 border border-gray-300 rounded-lg shadow-sm hover:shadow-lg transition-shadow"
            >
              <h2 className="text-xl font-medium text-gray-700">{member.name}</h2>
              <p className="text-gray-500">
                <strong>Email:</strong> {member.email}
              </p>
              <p className="text-gray-500">
                <strong>Phone:</strong> {member.phone}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
