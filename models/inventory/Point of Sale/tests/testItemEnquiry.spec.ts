import test from 'tape';
import { closeTestFyo, getTestFyo, setupTestFyo } from 'tests/helpers';
import { ItemEnquiry } from 'models/baseModels/ItemEnquiry/ItemEnquiry';
import { ModelNameEnum } from 'models/types';

const fyo = getTestFyo();
setupTestFyo(fyo, __filename);

test('ItemEnquiry lifecycle with similarProduct', async (t) => {
  const initialData = {
    item: 'Test Pen',
    customer: 'CustomerOne',
    contact: '1234567890',
    description: 'Need details about bulk purchase',
    similarProduct: 'Ink',
  };

  try {
    const newEnquiry = fyo.doc.getNewDoc(
      ModelNameEnum.ItemEnquiry,
      initialData
    ) as ItemEnquiry;
    await newEnquiry.sync();

    const createdEnquiry = (await fyo.doc.getDoc(
      ModelNameEnum.ItemEnquiry,
      newEnquiry.name as string
    )) as ItemEnquiry;

    t.ok(createdEnquiry, 'ItemEnquiry was created and fetched from DB');
    t.equal(createdEnquiry.item, initialData.item, 'Item matches after save');
    t.equal(
      createdEnquiry.similarProduct,
      initialData.similarProduct,
      'Similar product saved correctly'
    );

    const updatedData = {
      description: 'Updated enquiry details',
      similarProduct: 'Gel Pen',
    };

    createdEnquiry.description = updatedData.description;
    createdEnquiry.similarProduct = updatedData.similarProduct;
    await createdEnquiry.sync();

    const updatedEnquiry = (await fyo.doc.getDoc(
      ModelNameEnum.ItemEnquiry,
      newEnquiry.name as string
    )) as ItemEnquiry;

    t.equal(
      updatedEnquiry.description,
      updatedData.description,
      'Description updated successfully'
    );
    t.equal(
      updatedEnquiry.similarProduct,
      updatedData.similarProduct,
      'Similar product updated successfully'
    );
  } catch (err) {
    t.fail(err as string);
  }
});

closeTestFyo(fyo, __filename);
