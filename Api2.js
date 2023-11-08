const { Client } = require('pg');
const express = require('express');
const app = express();
const port = 2410;
app.use(express.json());
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", '*');
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE, HEAD"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// const pgConfig = {
//   user: 'postgres',
//   host: 'db.amfwwfhjovvvryqpgwpw.supabase.co',
//   database: 'postgres',
//   password: 'gaurav@Dahiya',
//   port: 5432, // or the port for your PostgreSQL server
// };

const client = new Client({
  user: 'postgres',
  host: 'db.amfwwfhjovvvryqpgwpw.supabase.co',
  database: 'postgres',
  password: 'gaurav@Dahiya',
  port: 5432, 
  ssl:{rejectUnauthorized:false}
});

client.connect(function(res,error){
  console.log('Connection!!!')
})

app.get('/shops', function (req, res) {
  const query = 'SELECT * FROM shops';
  client.query(query, (err, result) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.send(result.rows);
    }
  });
});

app.post('/shops', async (req, res) => {
    const { name, rent } = req.body;
    if (!name || !rent) {
      return res.status(400).send("Name and rent are required fields.");
    }
    const query = 'INSERT INTO shops (name, rent) VALUES ($1, $2) RETURNING *';
    const values = [name, rent];
    client.query(query,values,function(err,result){
      if(err) res.status(400).send(err.message)
      res.send(`${result.rowCount} insertion successfull`)
    })
  
    // try {
    //   const { rows } = await Client.query(query, values);
    //   res.status(201).json({ message: 'Shop added', shop: rows[0] });
    // } catch (err) {
    //   res.status(500).send(err.message);
    // }
  });

  // Get all products
app.get('/products', async (req, res) => {
    try {
      const query = 'SELECT * FROM products';
      const { rows } = await Client.query(query);
      res.json(rows);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });
  
// Get a specific product by ID
app.get('/products/:id', async (req, res) => {
    try {
      const productId = req.params.id;
      const query = 'SELECT * FROM products WHERE productId = $1';
      const { rows } = await Client.query(query, [productId]);
  
      if (rows.length === 0) {
        res.status(404).send('Product not found');
      } else {
        res.json(rows[0]);
      }
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  // Create a new product
app.post('/products', async (req, res) => {
    try {
      const body = req.body;
      if (!body.productName || !body.category || !body.description) {
        return res.status(400).send('Fill in all data of products');
      }
  
      const { productName, category, description } = body;
      const query = 'INSERT INTO products (productName, category, description) VALUES ($1, $2, $3';
      const values = [productName, category, description];
  
      await Client.query(query, values);
  
      res.status(201).send('Product added successfully');
    } catch (err) {
      res.status(500).send(err.message);
    }
  });
  
  // Update a product by ID
app.put('/products/:id', async (req, res) => {
    try {
      const productId = req.params.id;
      const body = req.body;
  
      if (!body.productName || !body.category || !body.description) {
        return res.status(400).send('Fill in all data of the product');
      }
  
      const { productName, category, description } = body;
      const query = 'UPDATE products SET productName = $1, category = $2, description = $3 WHERE productId = $4';
      const values = [productName, category, description, productId];
  
      await Client.query(query, values);
  
      res.send('Product updated successfully');
    } catch (err) {
      res.status(500).send(err.message);
    }
  });
  
  
  // Get purchases with filtering and sorting
app.get('/purchases', async (req, res) => {
    try {
      const shopId = req.query.shop;
      const productIds = req.query.product ? req.query.product.split(',') : [];
      const sort = req.query.sort;
  
      let query = 'SELECT * FROM purchases';
  
      if (shopId) {
        query += ` WHERE shopId = $1`;
      }
  
      if (productIds.length > 0) {
        query += shopId ? ' AND' : ' WHERE';
        query += ` productid = ANY($2)`;
      }
  
      if (sort) {
        switch (sort) {
          case 'QtyAsc':
            query += ' ORDER BY quantity ASC';
            break;
          case 'QtyDesc':
            query += ' ORDER BY quantity DESC';
            break;
          case 'ValueAsc':
            query += ' ORDER BY (quantity * price) ASC';
            break;
          case 'ValueDesc':
            query += ' ORDER BY (quantity * price) DESC';
            break;
          default:
            break;
        }
      }
  
      const values = [shopId, productIds];
  
      const result = await Client.query(query, values);
  
      res.send(result.rows);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });
  

  app.get('/purchases/shops/:id', async (req, res) => {
    try {
      const shopId = req.params.id;
      const query = 'SELECT * FROM purchases WHERE shopId = $1';
      const values = [shopId];
  
      const result = await Client.query(query, values);
  
      res.send(result.rows);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });
  
  app.get('/purchases/products/:id', async (req, res) => {
    try {
      const productId = req.params.id;
      const query = 'SELECT * FROM purchases WHERE productid = $1';
      const values = [productId];
  
      const result = await Client.query(query, values);
  
      res.send(result.rows);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  app.get('/totalPurchase/shop/:id', async (req, res) => {
    try {
      const shopId = req.params.id;
      const query = `
        SELECT productid, SUM(quantity) as totalQuantity, SUM(price * quantity) as totalValue
        FROM purchases
        WHERE shopId = $1
        GROUP BY productid
      `;
      const values = [shopId];
  
      const result = await Client.query(query, values);
  
      res.send(result.rows);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  app.get('/totalPurchase/product/:id', async (req, res) => {
    try {
      const productId = req.params.id;
      const query = `
        SELECT shopId, SUM(quantity) as totalQuantity, SUM(price * quantity) as totalValue
        FROM purchases
        WHERE productid = $1
        GROUP BY shopId
      `;
      const values = [productId];
  
      const result = await Client.query(query, values);
  
      res.send(result.rows);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  app.post('/purchases', async (req, res) => {
    try {
      const body = req.body;
      if (!body.shopId || !body.productid || !body.quantity || !body.price) {
        return res.status(400).send("All purchase data must be provided.");
      }
  
      const query = `
        INSERT INTO purchases (shopId, productid, quantity, price)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      const values = [body.shopId, body.productid, body.quantity, body.price];
  
      const result = await Client.query(query, values);
  
      res.status(201).send(`Purchase added with ID: ${result.rows[0].purchaseid}`);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });
  


  function mapColumnNames(oldColumns) {
    const columnMapping = {
      shopId: 'shopid',
      productId: 'productid',
      purchaseId: 'purchaseid',
      // Add more mappings here if needed
    };
  
    // Map the old column names to new names
    const newColumns = oldColumns.map((column) => columnMapping[column] || column);
  
    return newColumns;
  }
  