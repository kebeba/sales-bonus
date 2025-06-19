/**
 * Функция для расчета прибыли
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // Расчет прибыли от операции
   const discount = 1 - (purchase.discount / 100);
   return discount * purchase.quantity * purchase.sale_price
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // Расчет бонуса от позиции в рейтинге
    switch (index) {
        case 0:
            return 0.15
        case 1:
        case 2:
            return 0.10
        case total - 1:
            return 0.00
        default:
            return 0.05
    }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // Проверка входных данных
    if (
        !data ||
        !(Array.isArray(data.sellers) && data.sellers.length !== 0) ||
        !(Array.isArray(data.customers) && data.customers.length !== 0) ||
        !(Array.isArray(data.products) && data.products.length !== 0) ||
        !(Array.isArray(data.purchase_records) && data.purchase_records.length !== 0)
    ) {
        throw new Error('Некорректные входные данные');
    }

    // Проверка наличия опций
    const { calculateRevenue, calculateBonus } = options;
    if (
        !(calculateRevenue !== undefined && typeof calculateRevenue === "function") ||
        !(calculateBonus !== undefined && typeof calculateBonus === "function")
    ) {
        throw new Error('Некорректные опции');
    }

    // Подготовка промежуточных данных для сбора статистики
    const sellerStats = data.sellers.map(seller => {
        return {
            id: seller.id,
            name: `${seller.first_name} ${seller.last_name}`,
            revenue: 0,
            profit: 0,
            sales_count: 0,
            products_sold: {},
        }
    });

    // Индексация продавцов и товаров для быстрого доступа
    const sellerIndex = Object.fromEntries(sellerStats.map(seller => [seller.id, seller]));
    const productIndex = Object.fromEntries(data.products.map(product => [product.sku, product]));

    // Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id]
        seller.sales_count += 1;
        seller.revenue += record.total_amount;

        record.items.forEach(item => {
            const product = productIndex[item.sku];
            const cost = product.purchase_price * item.quantity;
            const revenue = calculateRevenue(item);
            const profit = revenue - cost;
            seller.profit += profit;
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += item.quantity;
        });
    });

    // Сортировка продавцов по прибыли
    sellerStats.sort((a, b) => b.profit - a.profit);

    sellerStats.forEach((seller, index) => {
        // Назначение премий на основе ранжирования
        seller.bonus = calculateBonus(index, sellerStats.length, seller);
        // Подготовка итоговой коллекции с нужными полями
        seller.top_products = Object.entries(seller.products_sold).map(element => {
            return {
                sku: element[0],
                quantity: element[1],
            }
        }).sort((a, b) => b.quantity - a.quantity).slice(0, 10);
    });

    return sellerStats.map(seller => ({
        seller_id: // Строка, идентификатор продавца
        name: // Строка, имя продавца
        revenue: // Число с двумя знаками после точки, выручка продавца
        profit: // Число с двумя знаками после точки, прибыль продавца
        sales_count: // Целое число, количество продаж продавца
        top_products: // Целое число, топ-10 товаров продавца
        bonus: // Число с двумя знаками после точки, бонус продавца
    })); 
}