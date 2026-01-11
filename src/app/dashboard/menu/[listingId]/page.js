'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function MenuEditor() {
    const { listingId } = useParams();
    const router = useRouter();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchMenu();
    }, [listingId]);

    const fetchMenu = async () => {
        try {
            const res = await fetch(`/api/menu?listingId=${listingId}`);
            const data = await res.json();
            if (data.menu) {
                setCategories(data.menu.categories);
            }
        } catch (error) {
            console.error('Failed to fetch menu:', error);
        } finally {
            setLoading(false);
        }
    };

    const c_addCategory = () => {
        setCategories([...categories, { name: '', items: [] }]);
    };

    const c_removeCategory = (index) => {
        const newCats = [...categories];
        newCats.splice(index, 1);
        setCategories(newCats);
    };

    const c_handleCategoryNameMsg = (index, value) => {
        const newCats = [...categories];
        newCats[index].name = value;
        setCategories(newCats);
    };

    const i_addItem = (catIndex) => {
        const newCats = [...categories];
        newCats[catIndex].items.push({ name: '', price: '', photo: '' });
        setCategories(newCats);
    };

    const i_removeItem = (catIndex, itemIndex) => {
        const newCats = [...categories];
        newCats[catIndex].items.splice(itemIndex, 1);
        setCategories(newCats);
    };

    const i_handleChange = (catIndex, itemIndex, field, value) => {
        const newCats = [...categories];
        newCats[catIndex].items[itemIndex][field] = value;
        setCategories(newCats);
    };

    const i_handleImageUpload = async (catIndex, itemIndex, file) => {
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            // Show some loading state strictly for this item if needed, but for now just wait
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (data.url) {
                i_handleChange(catIndex, itemIndex, 'photo', data.url);
            }
        } catch (error) {
            alert('Failed to upload image');
        }
    };

    const saveMenu = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/menu', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ listingId, categories }),
            });

            if (res.ok) {
                alert('Menu saved successfully!');
                router.push('/dashboard');
            } else {
                alert('Failed to save menu');
            }
        } catch (error) {
            alert('Error saving menu');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading menu...</div>;

    return (
        <div className="container" style={{ maxWidth: '800px', margin: '40px auto' }}>
            <h1 className="text-2xl font-bold mb-6">Manage Menu</h1>

            {categories.map((cat, catIndex) => (
                <div key={catIndex} className="glass card mb-6" style={{ marginBottom: '30px', padding: '20px', border: '1px solid #eee' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <input
                            value={cat.name}
                            onChange={(e) => c_handleCategoryNameMsg(catIndex, e.target.value)}
                            placeholder="Category Name (e.g. Breakfast)"
                            className="input"
                            style={{ fontSize: '1.2rem', fontWeight: 'bold' }}
                        />
                        <button onClick={() => c_removeCategory(catIndex)} style={{ color: 'red' }}>Remove Category</button>
                    </div>

                    <div style={{ paddingLeft: '20px' }}>
                        {cat.items.map((item, itemIndex) => (
                            <div key={itemIndex} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center', background: 'rgba(255,255,255,0.5)', padding: '10px', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
                                    <input
                                        placeholder="Product Name"
                                        value={item.name}
                                        onChange={(e) => i_handleChange(catIndex, itemIndex, 'name', e.target.value)}
                                        className="input"
                                    />
                                    <input
                                        placeholder="Price (e.g. 45$)"
                                        value={item.price}
                                        onChange={(e) => i_handleChange(catIndex, itemIndex, 'price', e.target.value)}
                                        className="input"
                                    />
                                    <textarea
                                        placeholder="Description (e.g. Eggs, beacon, toast...)"
                                        value={item.description || ''}
                                        onChange={(e) => i_handleChange(catIndex, itemIndex, 'description', e.target.value)}
                                        className="input"
                                        rows="2"
                                        style={{ resize: 'vertical' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                                    {item.photo && <img src={item.photo} alt="preview" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />}
                                    <label className="btn" style={{ fontSize: '0.8rem', padding: '2px 5px', cursor: 'pointer' }}>
                                        {item.photo ? 'Change Photo' : 'Add Photo'}
                                        <input type="file" hidden accept="image/*" onChange={(e) => i_handleImageUpload(catIndex, itemIndex, e.target.files[0])} />
                                    </label>
                                </div>

                                <button onClick={() => i_removeItem(catIndex, itemIndex)} style={{ color: 'red', fontSize: '1.2rem' }}>&times;</button>
                            </div>
                        ))}
                        <button onClick={() => i_addItem(catIndex)} className="btn" style={{ marginTop: '10px', fontSize: '0.9rem' }}>+ Add Product</button>
                    </div>
                </div>
            ))}

            <button onClick={c_addCategory} className="btn" style={{ width: '100%', marginBottom: '20px' }}>+ Add New Category</button>

            <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={saveMenu} disabled={saving} className="btn" style={{ flex: 1, background: '#00b894' }}>{saving ? 'Saving...' : 'Save Menu'}</button>
                <button onClick={() => router.back()} className="btn" style={{ background: '#636e72' }}>Cancel</button>
            </div>
        </div>
    );
}
