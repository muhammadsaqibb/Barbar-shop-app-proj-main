
import { Firestore, collection, writeBatch, getDocs, doc } from 'firebase/firestore';
import services from './services.json';
import barbers from './barbers.json';

export const seedDatabase = async (db: Firestore, shopId?: string) => {
  try {
    const servicesCollection = collection(db, 'services');
    // If shopId is provided, check if services exist for this shop
    // If not provided, check if ANY services exist (legacy behavior)
    let servicesSnapshot;
    if (shopId) {
      // We can't query efficiently without index, but for seeding it's okay to just add them?
      // Or we should check if they exist.
      // Let's just always add them if the user requests it? 
      // Or better, let's just add them with a new ID (or same ID + shopId suffix)
      // For simplicity, let's assume we are seeding for a fresh shop.
    }

    // Actually, always writing is safer if we want to force seed. 
    // But let's keep the "check empty" logic but scoped to shopId if possible?
    // Since we can't easily query without index, let's just proceed to write batch.

    // WAIT: keys in services.json might conflict if we use the same IDs for multiple shops.
    // We MUST generate new IDs for multi-tenant services.

    const batch = writeBatch(db);

    services.forEach((service) => {
      // Create a unique ID if shopId is involved
      const docId = shopId ? `${service.id}_${shopId}` : service.id;
      const docRef = doc(db, 'services', docId);

      const serviceData = {
        ...service,
        shopId: shopId || 'default', // Fallback to 'default' if no shopId
        enabled: true
      };

      batch.set(docRef, serviceData);
    });

    barbers.forEach((barber) => {
      const docId = shopId ? `${barber.id}_${shopId}` : barber.id;
      const docRef = doc(db, 'barbers', docId);

      const barberData = {
        ...barber,
        shopId: shopId || 'default'
      };
      batch.set(docRef, barberData);
    });

    await batch.commit();
    console.log(`Database seeded successfully for shop: ${shopId || 'default'}`);

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error; // Re-throw to handle in UI
  }
};
