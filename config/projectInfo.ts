const projectInfo:
  {
    name: string,
    imageUrl: string,
    description: string,
    raffle: { afterNMints: number, endDate: string }
  } =
  {
    name: "Project Name",
    imageUrl: "https://images.unsplash.com/photo-1660062993695-9c81acfaceeb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1932&q=80",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis hendrerit in erat sit amet posuere. Quisque ante mauris, finibus vitae pharetra a, luctus non turpis. Mauris faucibus ut dolor sed aliquet. Donec mollis augue sapien, vel finibus turpis sagittis vel. Pellentesque consectetur luctus urna eu faucibus. Aliquam congue est vitae dolor consequat tempus. Nulla hendrerit, tellus at tempus imperdiet, justo risus tristique nisl, ac finibus lacus libero maximus magna. Nulla tellus metus, scelerisque ut ipsum ac, finibus tempor turpis. Ut iaculis augue sed arcu congue, sit amet iaculis ante vulputate. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Vivamus mollis aliquet tortor, in convallis metus eleifend in. Nullam varius risus sit amet tortor aliquet, vel euismod leo sagittis.",
    raffle: {
      // After n% of mints the raffle is displayed
      afterNMints: 20,
      // YYYY-MM-DDTHH:MM:SS Z for UTC
      endDate: "2023-03-27T03:35:40.000Z"
    }
  }

export default projectInfo;