function calculateSimpleRevenue(purchase, _product) {
  const discount = 1 - purchase.discount / 100;
  return purchase.sale_price * purchase.quantity * discount;
}

function calculateBonusByProfit(index, total, seller) {
  const { profit } = seller;
  if (index === 0) {
    return profit * 0.15;
  } else if (index <= 2 && index > 0) {
    return profit * 0.1;
  } else if (index === total - 1) {
    return 0;
  } else {
    return profit * 0.05;
  }
}

function analyzeSalesData(data, options) {
  try {
    if (!data || !Array.isArray(data.sellers)) {
      throw new Error('Некорректные входные данные');
    }
    
    if (typeof options !== 'object') {
      throw new Error('Параметр options должен быть объектом.');
    }

    const sellerStats = data.sellers.map((seller) => ({
      id: seller.id,
      name: `${seller.first_name} ${seller.last_name}`,
      revenue: 0,
      profit: 0,
      sales_count: 0,
      products_sold: {}
    }));

    const sellerIndex = Object.fromEntries(
      sellerStats.map((seller) => [seller.id, seller])
    );

    const productIndex = Object.fromEntries(
      data.products.map((product) => [product.sku, product])
    );

    data.purchase_records.forEach((record) => {
      const seller = sellerIndex[record.seller_id];
      seller.sales_count++;
      seller.revenue += record.total_amount;
      
      record.items.forEach((item) => {
        const product = productIndex[item.sku];
        const cost = product.purchase_price * item.quantity;
        const revenue = calculateRevenue(item.sale_price, item.quantity, item.discount);
        
        const profit = revenue - cost;
        seller.profit += profit;
        
        if (!seller.products_sold[item.sku]) {
          seller.products_sold[item.sku] = 0;
        }
        seller.products_sold[item.sku] += item.quantity;
      });
    });

    sellerStats.sort((a, b) => b.profit - a.profit);

    sellerStats.forEach((seller, index) => {
      seller.bonus = calculateBonusByProfit(index, sellerStats.length, seller);
      seller.top_products = Object.entries(seller.products_sold)
        .map(([sku, quantity]) => ({ sku, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);
    });

    return sellerStats.map((seller) => ({
      seller_id: seller.id,
      name: seller.name,
      revenue: +seller.revenue.toFixed(2),
      profit: +seller.profit.toFixed(2),
      sales_count: seller.sales_count,
      top_products: seller.top_products,
      bonus: +seller.bonus.toFixed(2)
    }));
  } catch (err) {
    console.error(err.message);
    return [];
  }
}

function calculateRevenue(salePrice, quantity, discountPercent) {
  const discountFactor = 1 - discountPercent / 100;
  return salePrice * quantity * discountFactor;
}