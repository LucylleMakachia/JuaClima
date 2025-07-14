function HeroSection() {
  return (
    <section
  className="relative bg-cover bg-center bg-no-repeat py-24 px-6 text-white"
  style={{ backgroundImage: "url('/your-image.jpg')" }} //remember to add image
>
  <div className="bg-black/50 absolute inset-0"></div> {/* Overlay */}
  <div className="relative z-10 max-w-4xl mx-auto text-center">
    <h1 className="text-4xl md:text-5xl font-bold mb-4">
      Empowering Kenya’s Climate Response
    </h1>
    <p className="text-lg md:text-xl mb-6">
      JuaClima helps local communities, researchers, and decision-makers monitor climate risks, share insights, and respond effectively.
    </p>
    <a
      href="#map"
      className="inline-block bg-green-600 px-6 py-3 rounded-lg shadow hover:bg-green-700"
    >
      Explore Dashboard
    </a>
  </div>
</section>

  );
}

export default HeroSection;
