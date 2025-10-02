export default function Services() {
  const services = [
    {
      icon: "💻",
      title: "Ремонт компьютеров",
      description: "Диагностика и ремонт ПК, замена комплектующих, чистка от пыли"
    },
    {
      icon: "🖥️",
      title: "Ремонт ноутбуков",
      description: "Замена экрана, клавиатуры, ремонт материнской платы"
    },
    {
      icon: "⚙️",
      title: "Настройка Windows",
      description: "Установка ОС, драйверов, программ, оптимизация системы"
    },
    {
      icon: "🛡️",
      title: "Защита от вирусов",
      description: "Установка антивируса, очистка от вредоносного ПО"
    },
    {
      icon: "💾",
      title: "Восстановление данных",
      description: "Восстановление удаленных файлов с жесткого диска"
    }
  ];

  return (
    <section id="services" className="container-px py-12 sm:py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-4 animate-fade-in-up">
          Наши услуги
        </h2>
        <p className="text-slate-300 text-lg animate-fade-in-up delay-200">
          Полный спектр IT-услуг для вашего комфорта
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service, index) => (
          <div 
            key={index}
            className="card p-6 hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 animate-fade-in-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="text-4xl mb-4 animate-float" style={{ animationDelay: `${index * 0.5}s` }}>
              {service.icon}
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">
              {service.title}
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              {service.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
