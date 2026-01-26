
import { Firestore, collection, writeBatch, getDocs, doc } from 'firebase/firestore';
import services from './services.json';
import barbers from './barbers.json';

export const seedDatabase = async (db: Firestore) => {
  try {
    const servicesCollection = collection(db, 'services');
    const servicesSnapshot = await getDocs(servicesCollection);
    if (servicesSnapshot.empty) {
      const batch = writeBatch(db);
      services.forEach((service) => {
        const docRef = doc(db, 'services', service.id);
        batch.set(docRef, service);
      });
      await batch.commit();
      console.log('Services seeded successfully.');
    } else {
      console.log('Services collection already exists. Skipping seed.');
    }

    const barbersCollection = collection(db, 'barbers');
    const barbersSnapshot = await getDocs(barbersCollection);
    if (barbersSnapshot.empty) {
      const batch = writeBatch(db);
      barbers.forEach((barber) => {
        const docRef = doc(db, 'barbers', barber.id);
        batch.set(docRef, barber);
      });
      await batch.commit();
      console.log('Barbers seeded successfully.');
    } else {
      console.log('Barbers collection already exists. Skipping seed.');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};
