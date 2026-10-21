import { Image } from 'expo-image';
import { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Product = {
  id: number;
  title: string;
  description?: string;
  category?: string;
  price?: number;
  thumbnail?: string;
  images?: string[];
  [key: string]: unknown;
};

type ProductsResponse = {
  products: Product[];
};

export default function HomeScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [latestProduct, setLatestProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayedProducts = latestProduct
    ? [latestProduct, ...products.filter(product => product.id !== latestProduct.id)]
    : products;

  async function getProducts() {
    await loadProducts(
      'https://dummyjson.com/products?limit=0&select=id,title,description,category,price,stock,tags,brand,thumbnail,images',
    );
  }

  async function loadProducts(url: string) {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = (await response.json()) as ProductsResponse;
      setProducts(data.products);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load products.');
    } finally {
      setLoading(false);
    }
  }

  async function postProduct() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('https://dummyjson.com/products/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          category,
          price: Number(price),
          userId: 1,
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const createdProduct = (await response.json()) as Product;
      setLatestProduct(createdProduct);
      setShowForm(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to create product.');
    } finally {
      setLoading(false);
    }
  }

  function startEditing(product: Product) {
    setEditingProduct(product);
    setTitle(product.title);
    setDescription(product.description ?? '');
    setCategory(product.category ?? '');
    setPrice(product.price?.toString() ?? '');
    setShowForm(true);
    setError(null);
  }

  function startCreating() {
    setEditingProduct(null);
    setTitle('');
    setDescription('');
    setCategory('');
    setPrice('');
    setShowForm(!showForm);
    setError(null);
  }

  async function updateProduct() {
    if (!editingProduct) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://dummyjson.com/products/${editingProduct.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          category,
          price: Number(price),
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const updatedProduct = (await response.json()) as Product;
      setProducts(currentProducts =>
        currentProducts.map(product =>
          product.id === updatedProduct.id ? { ...product, ...updatedProduct } : product,
        ),
      );
      setLatestProduct(current =>
        current?.id === updatedProduct.id ? { ...current, ...updatedProduct } : current,
      );
      setEditingProduct(null);
      setShowForm(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update product.');
    } finally {
      setLoading(false);
    }
  }

  async function deleteProduct(product: Product) {
    if (latestProduct?.id === product.id) {
      setLatestProduct(null);
      setProducts(currentProducts => currentProducts.filter(item => item.id !== product.id));
      if (editingProduct?.id === product.id) {
        setEditingProduct(null);
        setShowForm(false);
      }
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://dummyjson.com/products/${product.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      await response.json();
      setProducts(currentProducts => currentProducts.filter(item => item.id !== product.id));
      setLatestProduct(current => (current?.id === product.id ? null : current));
      if (editingProduct?.id === product.id) {
        setEditingProduct(null);
        setShowForm(false);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to delete product.');
    } finally {
      setLoading(false);
    }
  }

  function formatValue(value: unknown) {
    if (typeof value === 'string') {
      return value;
    }
    if (value === null || value === undefined) {
      return String(value);
    }
    return typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <FlatList
          data={displayedProducts}
          keyExtractor={product => String(product.id)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
          ListHeaderComponent={
            <View>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.actionButton, loading && styles.disabledButton]}
                  onPress={getProducts}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>Get All Products (Hide Meta)</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => {
                  if (showForm) {
                    setShowForm(false);
                    setEditingProduct(null);
                    setError(null);
                  } else {
                    startCreating();
                  }
                }}
              >
                <Text style={styles.toggleButtonText}>
                  {showForm ? (editingProduct ? 'Cancel Update' : 'Hide Form') : 'Post Product'}
                </Text>
              </TouchableOpacity>

              {showForm && (
                <View style={styles.formCard}>
                  <Text style={styles.formTitle}>
                    {editingProduct ? `Update Product #${editingProduct.id}` : 'New Product'}
                  </Text>
                  <Text style={styles.fieldLabel}>Title</Text>
                  <TextInput
                    style={styles.input}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Enter title"
                  />

                  <Text style={styles.fieldLabel}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.multilineInput]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Enter description"
                    multiline
                  />

                  <Text style={styles.fieldLabel}>Category</Text>
                  <TextInput
                    style={styles.input}
                    value={category}
                    onChangeText={setCategory}
                    placeholder="Enter category"
                  />

                  <Text style={styles.fieldLabel}>Price</Text>
                  <TextInput
                    style={styles.input}
                    value={price}
                    onChangeText={text => setPrice(text.replace(/[^0-9.]/g, ''))}
                    keyboardType="numeric"
                    placeholder="0.00"
                  />

                  <TouchableOpacity
                    style={[styles.submitButton, loading && styles.disabledButton]}
                    onPress={editingProduct ? updateProduct : postProduct}
                    disabled={loading}
                  >
                    <Text style={styles.submitButtonText}>
                      {loading
                        ? editingProduct
                          ? 'Updating...'
                          : 'Submitting...'
                        : editingProduct
                          ? 'Update Product'
                          : 'Submit Product'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {loading && <Text style={styles.statusText}>Loading...</Text>}
              {error && <Text style={styles.errorText}>{error}</Text>}

              <Text style={styles.listTitle}>
                Products ({displayedProducts.length})
              </Text>
            </View>
          }
          ListEmptyComponent={
            <Text style={styles.statusText}>Tap a GET button to load products.</Text>
          }
          renderItem={({ item }) => {
            const imageUrls = [...new Set([item.thumbnail, ...(item.images ?? [])])]
              .filter((url): url is string => typeof url === 'string' && url.length > 0);

            return (
              <View style={styles.productCard}>
                {latestProduct?.id === item.id && (
                  <Text style={styles.latestLabel}>Latest post</Text>
                )}
                {imageUrls.length > 0 && (
                  <View style={styles.imageList}>
                    {imageUrls.map((url, index) => (
                      <Image
                        key={`${item.id}-${url}`}
                        source={{ uri: url }}
                        contentFit="cover"
                        accessibilityLabel={`${item.title} image ${index + 1}`}
                        style={styles.productImage}
                      />
                    ))}
                  </View>
                )}
                {Object.entries(item)
                  .filter(([key]) => key !== 'meta' && key !== 'thumbnail' && key !== 'images')
                  .map(([key, value]) => (
                    <View key={key} style={styles.dataField}>
                      <Text style={styles.dataLabel}>{key}</Text>
                      <Text selectable style={styles.dataValue}>
                        {formatValue(value)}
                      </Text>
                    </View>
                  ))}
                <View style={styles.productActions}>
                  <TouchableOpacity
                    style={[styles.editButton, loading && styles.disabledButton]}
                    onPress={() => startEditing(item)}
                    disabled={loading}
                  >
                    <Text style={styles.actionText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.deleteButton, loading && styles.disabledButton]}
                    onPress={() => deleteProduct(item)}
                    disabled={loading}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardView: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    flexGrow: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'powderblue',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#0f172a',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  toggleButton: {
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  toggleButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  formCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0f172a',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
  },
  statusText: {
    color: '#64748b',
    textAlign: 'center',
    paddingVertical: 16,
  },
  errorText: {
    color: '#b91c1c',
    paddingVertical: 12,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  itemSeparator: {
    height: 12,
  },
  productCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  imageList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  productImage: {
    width: 96,
    height: 96,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  dataField: {
    marginBottom: 10,
  },
  dataLabel: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
    marginBottom: 3,
  },
  dataValue: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 18,
  },
  productActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  editButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#dbeafe',
  },
  deleteButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#fee2e2',
  },
  actionText: {
    color: '#1d4ed8',
    fontWeight: '700',
  },
  deleteButtonText: {
    color: '#b91c1c',
    fontWeight: '700',
  },
  latestLabel: {
    color: '#15803d',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  productTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  productDescription: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  productDetail: {
    color: '#334155',
    fontSize: 13,
    marginTop: 3,
  },
});
