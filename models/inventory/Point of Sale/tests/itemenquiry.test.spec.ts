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
    const enquiryDoc = fyo.doc.getNewDoc(
      ModelNameEnum.ItemEnquiry,
      initialData
    ) as ItemEnquiry;
    await enquiryDoc.sync();

    const fetched = (await fyo.doc.getDoc(
      ModelNameEnum.ItemEnquiry,
      enquiryDoc.name as string
    )) as ItemEnquiry;

    t.ok(fetched, 'ItemEnquiry was created and fetched from DB');
    t.equal(fetched.item, initialData.item, 'Item matches after save');
    t.equal(
      fetched.similarProduct,
      initialData.similarProduct,
      'Similar product saved correctly'
    );

    const updatedData = {
      description: 'Updated enquiry details',
      similarProduct: 'Gel Pen',
    };

    fetched.description = updatedData.description;
    fetched.similarProduct = updatedData.similarProduct;
    await fetched.sync();

    const updated = (await fyo.doc.getDoc(
      ModelNameEnum.ItemEnquiry,
      enquiryDoc.name as string
    )) as ItemEnquiry;

    t.equal(
      updated.description,
      updatedData.description,
      'Description updated successfully'
    );
    t.equal(
      updated.similarProduct,
      updatedData.similarProduct,
      'Similar product updated successfully'
    );
  } catch (err) {
    t.fail(err as string);
  }
});

closeTestFyo(fyo, __filename);
